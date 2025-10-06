# Preskriptor

## Overview
Preskriptor is a comprehensive medical platform designed for nutritionists and healthcare professionals specializing in obesity treatment. It integrates AI, document processing, prescription management, and patient care tools to optimize medical workflows and improve patient outcomes. The platform aims to provide secure and intelligent medical prescriptions with AI.

## Recent Achievements (28/Aug/2025)
- ✅ **Conversation Management System**: Full Firebase integration for saving chat conversations
- ✅ **Automatic Message Persistence**: Every user and AI message saved to Firestore with unique conversation hash
- ✅ **Smart Conversation Creation**: New conversation created automatically when selecting a module
- ✅ **Sidebar History Display**: Shows last 5 conversations with "Chat DD-MM-YYYY" format titles
- ✅ **Complete History Access**: "Ver todas" button to view all user conversations
- ✅ **Improved Chat Interface**: Uniform category buttons occupying 100% width with perfect grid layout
- ✅ **Enhanced Navigation**: "Ver todos os módulos" link for accessing all modules at once
- ✅ **Firebase Conversation Schema**: Structured data with user ID, conversation hash, messages array, timestamps
- ✅ **Real-time Message Saving**: Messages saved during streaming for complete conversation tracking
- ✅ **Previous Category Achievements**: 5 medical categories with interactive chat flow and visual feedback

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
### Frontend
- **Framework**: React with TypeScript
- **Routing**: Wouter
- **State Management**: React Query (server state), React Context (auth state)
- **UI Components**: Radix UI with shadcn/ui
- **Styling**: Tailwind CSS with custom theming
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ES modules)
- **Database**: Drizzle ORM for PostgreSQL (Neon Database)
- **Authentication**: Firebase Authentication
- **File Storage**: Firestore (for document data)
- **API Design**: RESTful

### Core Features
- **Authentication**: Firebase Authentication for secure, role-based user management.
- **Document Processing**: Google Document AI (primary) and OpenAI Vision API (fallback) for OCR of medical documents (PDF, JPEG, PNG, GIF, WEBP).
- **AI Integration**: OpenAI GPT-4 for medical consultation and decision support, custom prompts for nutrition/obesity, dynamic AI assistant management, and OpenAI Whisper for audio transcription.
- **Digital Prescription**: Integration with Memed for generating and managing digital prescriptions, doctor registration, and template-based protocols.
- **Payment Processing**: Stripe for subscription management and secure payment processing.
- **Data Flow**: Defined flows for user authentication, document processing, prescription generation, and consultation management.
- **UI/UX**: Consistent styling, integrated VSL page, and specific module interfaces (e.g., "Prontuário Blindado" with audio recording).
- **Security**: Environment variables for API keys, Firebase security rules, input validation, CORS, and CSP headers.

## External Dependencies
- **Google Cloud Services**: Document AI, Vision API
- **OpenAI Services**: GPT-4, Whisper, Assistants API
- **Firebase**: Authentication, Firestore, Functions
- **Stripe**: Payment processing
- **Memed**: Brazilian digital prescription platform
- **Neon Database**: Serverless PostgreSQL hosting