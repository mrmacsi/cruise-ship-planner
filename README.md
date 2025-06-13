# Cruise Ship Planner - Refactored Next.js Application

A comprehensive Schengen Area travel planning application built with Next.js, TypeScript, and Tailwind CSS. This project was refactored from a monolithic React component into a clean, modular architecture.

## 🌟 Live Demo

🚀 **[View Live Application](https://cruise-ship-planner-xd80oc46m-codeparkuk.vercel.app)**

> Experience the full functionality of the Schengen Travel Planner with real-time calculations, interactive timeline, and administrative features.

## 🚀 Features

- **Trip Management**: Add, edit, and delete travel trips with automatic Schengen area detection
- **Timeline Visualization**: Interactive drag-and-drop timeline for trip planning
- **Schengen Calculations**: Real-time calculation of 90/180-day Schengen area limits
- **UK Tax Residency**: Track days needed for UK tax residency requirements
- **Data Persistence**: Automatic saving to Redis cache via API
- **Admin Panel**: JSON editor for direct data manipulation

## 🏗️ Architecture

The application follows a modular component architecture with clear separation of concerns:

### 📁 Component Structure

```
src/
├── components/
│   ├── ui/                    # Reusable UI components
│   │   ├── TabNavigation.tsx  # Tab switching interface
│   │   ├── LoadingSpinner.tsx # Loading state indicator
│   │   └── StatusIndicator.tsx# Save status and reset button
│   ├── cruise/                # Trip planning components
│   │   ├── InfoPanel.tsx      # Schengen rules information
│   │   ├── DataTable.tsx      # Trip data table with CRUD
│   │   ├── DataForm.tsx       # Add new trip form
│   │   ├── Visualization.tsx  # Interactive timeline
│   │   ├── Statistics.tsx     # City limits and tax stats
│   │   └── Calculator.tsx     # Schengen days calculator
│   ├── admin/                 # Admin functionality
│   │   ├── AdminPanel.tsx     # JSON data editor
│   │   └── DataViewer.tsx     # Cache data viewer
│   └── CruiseShipPlanner.tsx  # Main orchestrating component
├── hooks/                     # Custom React hooks
│   ├── useCache.ts           # API/cache operations
│   ├── useData.ts            # Trip data management
│   ├── useCalculations.ts    # Schengen/tax calculations
│   ├── useInteractions.ts    # Drag & drop interactions
│   └── useAdminData.ts       # Admin panel logic
├── utils/                     # Utility functions
│   ├── constants.ts          # Default data and types
│   ├── api.ts               # API configuration
│   ├── dateUtils.ts         # Date calculations
│   └── calculations.ts      # Schengen logic
└── app/
    └── page.tsx             # Main page component
```

### 🔧 Custom Hooks

- **`useCache`**: Handles all API operations and caching logic
- **`useData`**: Manages trip CRUD operations and location data
- **`useCalculations`**: Computes Schengen and UK tax year statistics
- **`useInteractions`**: Manages timeline drag-and-drop functionality
- **`useAdminData`**: Handles admin panel data manipulation

### 🛠️ Utilities

- **`constants.ts`**: Centralized configuration, default data, and TypeScript types
- **`dateUtils.ts`**: Date manipulation and sorting functions
- **`calculations.ts`**: Complex Schengen area compliance calculations
- **`api.ts`**: API endpoint configuration

## 🎯 Benefits of Refactoring

### Before (Monolithic)
- ❌ Single 1000+ line component
- ❌ Mixed concerns (UI, logic, calculations)
- ❌ Difficult to test individual features
- ❌ Hard to maintain and extend
- ❌ No TypeScript safety

### After (Modular)
- ✅ 15+ focused, single-responsibility components
- ✅ Clear separation of UI, logic, and data
- ✅ Individually testable components and hooks
- ✅ Easy to maintain and extend
- ✅ Full TypeScript safety and IntelliSense
- ✅ Reusable components and hooks
- ✅ Better performance through component memoization

## 🚦 Getting Started

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Start development server:**
   ```bash
   pnpm dev
   ```

3. **Build for production:**
   ```bash
   pnpm build
   ```

4. **Start production server:**
   ```bash
   pnpm start
   ```

## 📊 Data Flow

```
User Interaction
       ↓
   Main Component (CruiseShipPlanner)
       ↓
   Custom Hooks (useData, useCalculations)
       ↓
   Utility Functions (calculations, dateUtils)
       ↓
   API Layer (useCache)
       ↓
   External Cache (Redis)
```

## 🔍 Key Features Explained

### Schengen Area Compliance
- Tracks 90-day limit within any 180-day rolling window
- Real-time validation with visual indicators
- City-specific calculations for multiple locations

### Interactive Timeline
- Drag to move entire trips
- Drag edges to resize trip duration
- Real-time sync with data table
- Visual month/year markers

### UK Tax Residency
- Calculates days needed for each tax year
- 90-day minimum requirement tracking
- Automatic overlap calculations

### Admin Panel
- Direct JSON editing of trip data
- View all cached data
- Instant save and refresh functionality

## 🧪 TypeScript Integration

The entire application is built with TypeScript, providing:
- Type-safe props and state management
- IntelliSense for better developer experience
- Compile-time error catching
- Better refactoring capabilities

## 🎨 Styling

- **Tailwind CSS**: Utility-first CSS framework
- **Responsive Design**: Mobile-friendly layouts
- **Consistent Design System**: Reusable color and spacing patterns
- **Accessibility**: ARIA labels and keyboard navigation

## 🔄 State Management

Uses React's built-in state management with custom hooks:
- Local component state for UI interactions
- Shared state through prop drilling (lightweight approach)
- External state persistence via API hooks
- Automatic data synchronization

## 📈 Performance Optimizations

- Component-level code splitting
- Efficient re-renders through proper hook dependencies
- Memoization opportunities for calculations
- Lazy loading of admin functionality

## 🚀 Deployment

This application is deployed on **Vercel** with automatic deployments from the main branch.

- **Production URL**: [https://cruise-ship-planner-xd80oc46m-codeparkuk.vercel.app](https://cruise-ship-planner-xd80oc46m-codeparkuk.vercel.app)
- **GitHub Repository**: [https://github.com/mrmacsi/cruise-ship-planner](https://github.com/mrmacsi/cruise-ship-planner)
- **Deployment Platform**: Vercel
- **Build Command**: `pnpm build`
- **Output Directory**: `.next`

### Environment Variables
No environment variables are required for basic functionality. The application uses a public Redis cache API for data persistence.

## 📝 Development Notes

### ESLint Configuration
- Extends Next.js core web vitals and TypeScript rules
- Custom rules for unused variables and React entities
- Automatic linting on build

### Git Workflow
- Main branch for production deployments
- Automatic Vercel deployments on push
- Conventional commit messages encouraged

This refactored architecture provides a solid foundation for future enhancements while maintaining excellent developer experience and user functionality.
# cruise-ship-planner
