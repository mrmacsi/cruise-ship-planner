# 🚢 MSC Cruise Manager

A modern, responsive web application for comparing and managing MSC cruise listings. Built with Next.js 14, TypeScript, and Tailwind CSS.

![Cruise Manager Screenshot](https://placehold.co/800x400/4f46e5/ffffff?text=MSC+Cruise+Manager+Dashboard)

## ✨ Features

### 🔍 **Cruise Comparison Tool**
- **Advanced Filtering**: Filter by ship, budget, departure date, and destinations
- **Real-time Search**: Instant search through cruise itineraries
- **Side-by-Side Comparison**: Compare up to 4 cruises simultaneously
- **Price Analysis**: View lowest prices across cabin categories
- **Detailed Itineraries**: Expandable port-by-port cruise details

### ⚙️ **Admin Panel**
- **CRUD Operations**: Add, edit, and delete cruise listings
- **Bulk Import**: Import multiple cruises via JSON
- **Form Validation**: Comprehensive data validation
- **Real-time Updates**: Instant UI updates after data changes

### 🎨 **User Experience**
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Accessibility**: WCAG compliant with ARIA labels and keyboard navigation
- **Error Handling**: Graceful error boundaries and user feedback
- **Loading States**: Visual feedback during API operations

## 🚀 Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: React Hooks (useState, useEffect, useCallback, useMemo)
- **API Integration**: Custom fetch hooks with error handling
- **Data Persistence**: External Redis cache API
- **Development**: ESLint, TypeScript strict mode

## 📦 Installation

### Prerequisites
- **Node.js** 18+ 
- **pnpm** (recommended) or npm

### Local Development

1. **Clone the repository**
   \`\`\`bash
   git clone https://github.com/mrmacsi/cruise-ship-planner.git
   cd cruise-ship-planner
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   pnpm install
   \`\`\`

3. **Start development server**
   \`\`\`bash
   pnpm dev
   \`\`\`

4. **Open in browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

\`\`\`
cruise-ship-planner/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── components/            # React components
│   │   ├── admin/             # Admin panel components
│   │   │   ├── BulkImportForm.tsx
│   │   │   ├── CruiseAdminPage.tsx
│   │   │   └── CruiseForm.tsx
│   │   ├── cruise/            # Cruise-related components
│   │   │   ├── ComparisonCard.tsx
│   │   │   ├── CruiseCard.tsx
│   │   │   └── CruiseComparisonPage.tsx
│   │   ├── ui/                # Reusable UI components
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── Icons.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   └── CruiseShipPlanner.tsx  # Main app component
│   ├── hooks/                 # Custom React hooks
│   │   ├── useApi.ts
│   │   └── useDebounce.ts
│   ├── types/                 # TypeScript type definitions
│   │   └── cruise.ts
│   └── utils/                 # Utility functions
│       ├── constants.ts
│       └── cruiseUtils.ts
├── public/                    # Static assets
├── CruiseShipPlanner.jsx     # Original monolithic component (preserved)
└── README.md
\`\`\`

## 🔧 Available Scripts

\`\`\`bash
# Development
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint

# Testing
pnpm type-check   # Run TypeScript compiler check
\`\`\`

## 🌐 Deployment

### Vercel (Recommended)

1. **Install Vercel CLI**
   \`\`\`bash
   npm i -g vercel
   \`\`\`

2. **Deploy**
   \`\`\`bash
   vercel
   \`\`\`

3. **Follow prompts** to link your project

### Other Platforms
The app can be deployed on any platform that supports Next.js:
- **Netlify**: Use \`@netlify/plugin-nextjs\`
- **Railway**: Connect your GitHub repository
- **AWS Amplify**: Use the Next.js build settings

## 🔌 API Integration

The application integrates with an external Redis cache API:

- **Base URL**: \`https://uno-game-eta.vercel.app/api/redis-cache\`
- **Methods**: GET (fetch), POST (create), PUT (update)
- **Data Format**: JSON array of cruise objects
- **Error Handling**: Network errors, 404 responses, validation errors

### Data Structure
\`\`\`typescript
interface CruiseData {
  'Unique Sailing ID': string;
  'Ship Name': string;
  'Duration': string;
  'Departure Port': string;
  'Departure Date': string;
  'Interior Price': string;
  'Ocean View Price': string;
  'Standard Balcony': string;
  'Suite Options': string;
  'Special Offers': string;
  'Itinerary Map': string;
  'Booking Link (Constructed)': string;
  'Complete Itinerary': ItineraryStop[];
}
\`\`\`

## 🎯 Performance Optimizations

- **Code Splitting**: Automatic route-based code splitting
- **Image Optimization**: Next.js Image component with lazy loading
- **Debounced Search**: 300ms debounce on search inputs
- **Memoization**: useMemo and useCallback for expensive operations
- **Error Boundaries**: Graceful error handling and recovery

## 🔒 Security Features

- **Input Sanitization**: XSS prevention on all user inputs
- **URL Validation**: Proper URL validation for external links
- **Type Safety**: Full TypeScript coverage
- **CORS Handling**: Proper CORS configuration for API calls

## 🎨 Design System

- **Colors**: Blue-focused palette with semantic color usage
- **Typography**: Inter font family via Tailwind
- **Spacing**: Consistent 4px base unit scale
- **Shadows**: Layered shadow system for depth
- **Animations**: Subtle hover and transition effects

## 📱 Browser Support

- **Chrome**: 88+
- **Firefox**: 85+
- **Safari**: 14+
- **Edge**: 88+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **MSC Cruises** for inspiration
- **Vercel** for hosting and deployment
- **Tailwind CSS** for the styling system
- **Next.js** team for the amazing framework

---

**Built with ❤️ by [Your Name](https://github.com/mrmacsi)**

*Happy cruising! 🚢* 