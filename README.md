# Lumina Finance 🌟

Lumina Finance is a modern, responsive, and visually stunning personal finance application built with React, Vite, and Tailwind CSS. It features a premium glassmorphic design, smooth animations, and a seamless user experience for tracking your expenses and income.

## ✨ Features

- **Beautiful Glassmorphic UI:** A state-of-the-art design featuring translucent panels, a dynamic 3D background, and vibrant gradients.
- **Seamless Authentication:** Securely log in using Google Authentication via Firebase, or start tracking immediately using the **Guest Mode** (powered by LocalStorage).
- **Interactive Dashboard:** View your financial overview with a dynamic Donut Chart, recent transactions, and quick summaries of your total balance, income, and expenses.
- **Monthly View Calendar:** Easily navigate through your expenses day-by-day or view your entire month at a glance using an intuitive calendar interface.
- **Multi-Currency Support:** Add transactions in multiple currencies (USD, EUR, GBP, PLN, JPY, CAD) and view your total balance converted to your preferred default currency using live exchange rates.
- **Smooth Animations:** Integrated with Framer Motion for delightful micro-interactions, layout morphing, and page transitions.
- **Fully Responsive:** Carefully crafted to look perfect on any device, from large desktop monitors down to mobile screens, with easily accessible touch targets and consistent pill-shaped elements.

## 🛠️ Tech Stack

- **Frontend Framework:** [React 18](https://react.dev/) with [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Backend & Auth:** [Firebase](https://firebase.google.com/) (Authentication & Firestore)
- **Currency Conversion:** [Frankfurter API](https://www.frankfurter.app/)

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- A Firebase project with Authentication (Google provider enabled) and Firestore Database set up.

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/jkbx1/luminafinance.git
   cd luminafinance
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory and add your Firebase configuration details. Ensure it matches the variables expected in `src/lib/firebase.ts`:

   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

4. **Start the development server:**

   ```bash
   npm run dev
   ```

5. **Build for production:**
   ```bash
   npm run build
   ```

## 🔒 Security & Architecture

- **Data Privacy:** Guest mode operates entirely locally using the browser's LocalStorage. When transitioning from a guest to an authenticated user, local data is automatically synced to Firestore and the local cache is wiped.
- **Secure Access:** Firestore security rules dictate that users can only read, write, and delete documents within their own `users/{userId}/transactions` collection path. Raw Firebase errors are sanitized before logging to the console.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/jkbx1/lumina-finance/issues).
