# ChatPaglu - Anonymous Chat Application

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black.svg?style=flat-square&logo=vercel)](https://chatpaglu.vercel.app)
[![Built with React](https://img.shields.io/badge/Built%20with-React-61DAFB.svg?style=flat-square&logo=react)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28.svg?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com/)

## 🌟 Overview

ChatPaglu is a modern, anonymous chat application that allows users to communicate in real-time without requiring registration. The app features end-to-end encryption, multiple chat rooms, and a clean, responsive UI built with React and shadcn-ui components.

![ChatPaglu Screenshot]

## ✨ Features

- **Anonymous Authentication**: Join conversations without registration
- **Real-time Messaging**: Instant message delivery powered by Firebase Realtime Database
- **End-to-End Encryption**: Messages are encrypted for privacy and security
- **Multiple Chat Rooms**: Create and join different chat rooms
- **Message Types**: Support for text, images, and voice messages
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **User Status**: See who's online in the chat
- **Message Editing**: Edit or delete your sent messages
- **Typing Indicators**: See when others are typing

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd reactiva-firebase-apps

# Install dependencies
npm install

# Start the development server
npm run dev
```

## 🔧 Environment Variables

To run this project, you'll need to add the following environment variables to your `.env` file:

```
VITE_ENCRYPTION_KEY=your_encryption_key
```

## 🛠️ Technologies Used

- **Frontend**:
  - React
  - TypeScript
  - Vite (Build tool)
  - shadcn-ui (UI components)
  - Tailwind CSS (Styling)
  - Lucide React (Icons)

- **Backend**:
  - Firebase Authentication
  - Firebase Realtime Database
  - Firebase Storage

- **Security**:
  - CryptoJS (End-to-end encryption)

## 🌐 Deployment

The application is deployed on Vercel and can be accessed at [chatpaglu.vercel.app](https://chatpaglu.vercel.app).

### Deploying Your Own Instance

1. Fork this repository
2. Set up a Firebase project and update the configuration in `src/firebase/config.ts`
3. Deploy to Vercel or your preferred hosting platform

## 📱 Mobile Support

ChatPaglu is fully responsive and works on all device sizes. The mobile version includes a slide-out sidebar for room navigation.

## 🔒 Privacy & Security

All messages in ChatPaglu are encrypted using AES-256 encryption. The encryption key is stored in environment variables and never exposed to the client.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Built with ❤️ using React, Firebase, and shadcn-ui components.
