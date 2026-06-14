# IShowChat — Real-time Chat

IShowChat is a real-time chat application built with a modern full-stack architecture.  
The project provides instant messaging, AI-powered sentiment analysis, persistent data storage, and a clean user experience.

## Application URL

https://blue-bush-06f7b2303-preview.westeurope.7.azurestaticapps.net/

## Features

### Real-time Messaging

IShowChat allows users to send and receive messages instantly without refreshing the page.

Main capabilities:

- Live message delivery
- Real-time chat updates
- Smooth communication experience
- SignalR-based connection between frontend and backend

### AI Sentiment Analysis

The application includes AI-based sentiment analysis for chat messages.

This feature can help identify the emotional tone of messages, such as:

- Positive
- Neutral
- Negative

### Data Persistence

Messages and application data are stored in a database, allowing the chat history to remain available after reloads or reconnects.

Main benefits:

- Persistent chat data
- Reliable storage
- Database-backed application state

### User Experience

The frontend is designed to be simple, responsive, and easy to use.

User experience features include:

- Clean chat interface
- Fast frontend built with Vite
- Responsive styling with Tailwind CSS
- Smooth real-time updates

## Tech Stack

### Backend

- ASP.NET Core 10.0
- REST API
- Azure SignalR integration

### Real-time Communication

- Azure SignalR Service

### Database

- Azure SQL Database

### Frontend

- React
- Vite
- Tailwind CSS

### Deployment

- Azure Web Apps
- Azure Static Web Apps

## Security

All sensitive configuration values are managed securely through Azure Environment Variables.

This includes:

- API keys
- Connection strings
- Service endpoints
- Database configuration

Sensitive data is not committed to GitHub.

## Hosting Note

The backend and database are hosted on Azure free tiers.

Because of this, the application may experience a cold start.  
If the page takes some time to load or the chat does not connect immediately, please wait around **30–60 seconds** for the server to wake up, then refresh the page.

## Project Structure

The application is split into frontend and backend parts:

- Frontend handles the user interface and chat experience
- Backend handles API logic, real-time communication, AI integration, and database access
- Azure services provide hosting, database storage, and real-time messaging infrastructure

## Author

Zakhar Rura