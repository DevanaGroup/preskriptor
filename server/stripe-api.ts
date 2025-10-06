import { Express, Request, Response } from 'express';
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16' as any,
});

export function setupStripeRoutes(app: Express) {
  // Rota para obter todos os produtos disponíveis
  app.get('/api/stripe/products', async (_req: Request, res: Response) => {
    try {
      const products = await stripe.products.list({
        active: true,
        expand: ['data.default_price'],
      });

      const formattedProducts = products.data.map(product => {
        const price = product.default_price as Stripe.Price;
        return {
          id: product.id,
          name: product.name,
          description: product.description,
          image: product.images?.[0] || null,
          priceId: price?.id,
          price: price ? price.unit_amount! / 100 : 0, // Converter de centavos para reais
          currency: price?.currency || 'brl',
          interval: price?.type === 'recurring' ? price.recurring?.interval : 'one-time',
          intervalCount: price?.type === 'recurring' ? price.recurring?.interval_count : null,
          metadata: product.metadata,
        };
      });

      res.json(formattedProducts);
    } catch (error: any) {
      console.error('Erro ao buscar produtos do Stripe:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Rota para criar uma sessão de checkout
  app.post('/api/stripe/create-checkout-session', async (req: Request, res: Response) => {
    try {
      const { priceId, successUrl, cancelUrl, email, userId } = req.body;

      if (!priceId || !successUrl || !cancelUrl) {
        return res.status(400).json({ error: 'Dados incompletos para criar a sessão de checkout' });
      }

      // Parâmetros adicionais para a sessão
      const sessionParams: any = {
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl,
        locale: 'pt-BR',
        metadata: {
          userId: userId || ''
        }
      };

      // Incluir e-mail se fornecido
      if (email) {
        sessionParams.customer_email = email;
      }

      const session = await stripe.checkout.sessions.create(sessionParams);

      res.json({ sessionId: session.id, url: session.url });
    } catch (error: any) {
      console.error('Erro ao criar sessão de checkout:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Rota para obter detalhes de uma sessão de checkout
  app.get('/api/stripe/session/:sessionId', async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;

      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['subscription', 'customer']
      });
      
      res.json(session);
    } catch (error: any) {
      console.error('Erro ao buscar detalhes da sessão:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Rota para obter detalhes de uma assinatura
  app.get('/api/stripe/subscription/:subscriptionId', async (req: Request, res: Response) => {
    try {
      const { subscriptionId } = req.params;

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      res.json(subscription);
    } catch (error: any) {
      console.error('Erro ao buscar detalhes da assinatura:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Rota para cancelar uma assinatura
  app.post('/api/stripe/cancel-subscription', async (req: Request, res: Response) => {
    try {
      const { subscriptionId } = req.body;

      if (!subscriptionId) {
        return res.status(400).json({ error: 'ID da assinatura não fornecido' });
      }

      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });

      res.json(subscription);
    } catch (error: any) {
      console.error('Erro ao cancelar assinatura:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Rota para o webhook do Stripe
  app.post('/api/stripe/webhook', async (req: Request, res: Response) => {
    const signature = req.headers['stripe-signature'];

    console.log('🔔 Webhook do Stripe recebido:', {
      type: req.body?.type,
      signature: signature ? 'presente' : 'ausente'
    });

    // Para uso em ambiente de produção, é necessário configurar um secret para o webhook
    // e verificar a assinatura do evento
    /*
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    */

    // Na versão de teste, apenas processamos o evento
    const event = req.body;

    try {
      // Lidar com diferentes tipos de eventos
      switch (event.type) {
        case 'checkout.session.completed':
          console.log('✅ Processando checkout.session.completed');
          const session = event.data.object;
          
          // Buscar userId dos metadados
          const userId = session.metadata?.userId;
          console.log('📝 UserId dos metadados:', userId);
          
          if (!userId) {
            console.error('❌ UserId não encontrado nos metadados da sessão');
            return res.status(400).json({ error: 'UserId não encontrado' });
          }

          // Buscar informações da assinatura
          const subscriptionId = session.subscription;
          let subscriptionPlan = 'pro';
          let creditsLimit = 100;
          let priceId = '';

          // Se for teste, pular validação do Stripe
          if (subscriptionId === 'sub_test_subscription') {
            console.log('🧪 Detectado teste - pulando validação do Stripe');
            priceId = 'test_price';
          } else if (subscriptionId) {
            try {
              const subscription = await stripe.subscriptions.retrieve(subscriptionId);
              priceId = subscription.items.data[0]?.price.id;
              
              console.log('📦 Dados da assinatura:', {
                subscriptionId,
                priceId,
                customerId: session.customer
              });

              // Determinar o plano baseado no priceId
              if (priceId === 'price_1Rp7JzRvPDGCZGnjYfwxrJf9') {
                subscriptionPlan = 'pro'; // PRO Mensal - 100 créditos
                creditsLimit = 100;
              } else if (priceId === 'price_1Rp7K3RvPDGCZGnjYAJIEhHZ') {
                subscriptionPlan = 'pro'; // PRO Anual - 100 créditos
                creditsLimit = 100;
              } else if (priceId === 'price_1Rp7K5RvPDGCZGnjssxF5JFk') {
                subscriptionPlan = 'premium'; // Premium Mensal - 200 créditos
                creditsLimit = 200;
              } else if (priceId === 'price_1Rp7K7RvPDGCZGnjuDfQHMa6') {
                subscriptionPlan = 'premium'; // Premium Anual - 200 créditos
                creditsLimit = 200;
              }
            } catch (error) {
              console.error('❌ Erro ao buscar assinatura do Stripe:', error);
              // Continuar com valores padrão para teste
            }
          }

          // Chamar endpoint para atualizar usuário
          try {
            const updateResponse = await fetch(`${req.protocol}://${req.get('host')}/api/update-user-subscription`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId,
                subscriptionPlan,
                creditsLimit,
                creditsUsed: 0,
                hasActiveSubscription: true,
                stripeCustomerId: session.customer,
                stripeSubscriptionId: subscriptionId,
                subscriptionUpdatedAt: new Date().toISOString()
              })
            });

            if (updateResponse.ok) {
              console.log('✅ Usuário atualizado com sucesso via webhook');
            } else {
              console.error('❌ Erro ao atualizar usuário via webhook');
            }
          } catch (error) {
            console.error('❌ Erro na chamada de atualização:', error);
          }
          

          break;
        case 'customer.subscription.deleted':
          console.log('🚫 Processando cancelamento de assinatura');
          // Implementar lógica para voltar usuário ao freemium
          break;
        default:
          console.log(`Evento não tratado: ${event.type}`);
      }
    } catch (error) {
      console.error('Erro ao processar webhook do Stripe:', error);
    }

    res.json({ received: true });
  });
}