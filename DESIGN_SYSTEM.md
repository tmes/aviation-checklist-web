# AEROCHECK DESIGN SYSTEM

## Icons

**Library:** Lucide React (https://lucide.dev)

**Installation:**
```bash
npm install lucide-react
```

**Usage:**
```tsx
import { Plane, CheckCircle, AlertTriangle, User, Settings } from 'lucide-react';

// Basic usage
<Plane className="w-5 h-5 text-blue-600" />

// With Tailwind classes
<CheckCircle className="w-6 h-6 text-green-500" />

// Animated
<AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
```

**IMPORTANT RULES:**
1. **NO EMOTICONS** - Never use emoji/emoticons anywhere in the UI (❌, ✅, 🎯, etc.)
2. **Use Lucide icons only** - All icons must be from the Lucide React library
3. **Consistent sizing** - Use w-4 h-4 (16px), w-5 h-5 (20px), or w-6 h-6 (24px)
4. **Semantic colors** - Use Tailwind color classes that match the context

## Icon Mapping

### Flight Phases
```tsx
import {
  CheckCircle,    // Pre-Flight
  Zap,            // Startup
  Play,           // After Startup
  Car,            // Taxi (or Truck)
  Gauge,          // Run-up
  Plane,          // Takeoff
  TrendingUp,     // Climb
  Navigation,     // Cruise (or Compass)
  TrendingDown,   // Descent
  Crosshair,      // Approach (or Target)
  Radio,          // Final
  PlaneLanding,   // Landing (fallback: Plane with ArrowDown)
  Check,          // After Landing
  StopCircle,     // Shutdown (or Power)
  AlertTriangle,  // Emergency
  AlertCircle,    // Abnormal
} from 'lucide-react';
```

### Aircraft Categories
```tsx
import {
  Plane,          // SEP (Single Engine Piston)
  Plane,          // MEP (Multi Engine Piston) - can add variant
  Rocket,         // JET
  Wind,           // UL (Ultralight)
  Fan,            // HELI (Helicopter) - or Waves
  CloudSun,       // GLIDER
  HelpCircle,     // OTHER
} from 'lucide-react';
```

### Status Badges
```tsx
import {
  CheckCircle,    // Airworthy (green)
  Wrench,         // Maintenance (orange/yellow)
  XCircle,        // Grounded (red)
  Clock,          // In Progress
  Check,          // Completed
  Ban,            // Aborted
} from 'lucide-react';
```

### User Interface
```tsx
import {
  User,           // User profile
  Users,          // Members/organization
  Settings,       // Settings
  LogOut,         // Logout
  LogIn,          // Login
  UserPlus,       // Register
  Search,         // Search
  Filter,         // Filter
  Plus,           // Add/Create
  Edit,           // Edit
  Trash2,         // Delete
  Save,           // Save
  X,              // Close/Cancel
  ChevronDown,    // Dropdown
  ChevronRight,   // Expand
  Menu,           // Hamburger menu
  Bell,           // Notifications
  Star,           // Favorite
  Upload,         // Upload/Import
  Download,       // Download/Export
  Copy,           // Duplicate/Fork
  Share2,         // Share
  Eye,            // View
  EyeOff,         // Hide
  Lock,           // Locked/Private
  Unlock,         // Unlocked/Public
  Shield,         // Admin/Security
  Crown,          // Owner
  GraduationCap,  // Instructor
  UserCheck,      // Qualified
} from 'lucide-react';
```

### Super Admin
```tsx
import {
  Shield,         // Super admin badge
  Database,       // System/Database
  Activity,       // Monitoring/Analytics
  BarChart2,      // Statistics
  Users,          // User management
  Building2,      // Organizations
  FileText,       // Logs
  Settings,       // System settings
} from 'lucide-react';
```

## Component Examples

### Icon Button
```tsx
<button className="p-2 rounded-lg hover:bg-gray-100">
  <Plus className="w-5 h-5 text-gray-700" />
</button>
```

### Icon with Text
```tsx
<div className="flex items-center gap-2">
  <Plane className="w-5 h-5 text-blue-600" />
  <span className="text-sm font-medium">Cessna 172</span>
</div>
```

### Status Badge
```tsx
<span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
  <CheckCircle className="w-3.5 h-3.5" />
  Airworthy
</span>
```

### Navigation Item
```tsx
<Link to="/aircraft" className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
  <Plane className="w-5 h-5" />
  <span>Aircraft</span>
</Link>
```

## Colors

### Semantic Colors (Tailwind)
```tsx
// Success (Green)
text-green-600, bg-green-100, border-green-300

// Warning (Yellow/Orange)
text-yellow-600, bg-yellow-100, border-yellow-300
text-orange-600, bg-orange-100, border-orange-300

// Error/Danger (Red)
text-red-600, bg-red-100, border-red-300

// Info (Blue)
text-blue-600, bg-blue-100, border-blue-300

// Neutral (Gray)
text-gray-600, bg-gray-100, border-gray-300

// Primary (Custom - TBD)
text-sky-600, bg-sky-100, border-sky-300
```

### Aircraft Status Colors
```tsx
airworthy:   'text-green-600 bg-green-100'
maintenance: 'text-orange-600 bg-orange-100'
grounded:    'text-red-600 bg-red-100'
```

### Checklist Category Colors
```tsx
normal:    'text-blue-600 bg-blue-100'
emergency: 'text-red-600 bg-red-100'
abnormal:  'text-orange-600 bg-orange-100'
```

### User Role Colors
```tsx
super_admin: 'text-purple-600 bg-purple-100' // Super admin badge
owner:       'text-indigo-600 bg-indigo-100'
admin:       'text-blue-600 bg-blue-100'
instructor:  'text-cyan-600 bg-cyan-100'
member:      'text-gray-600 bg-gray-100'
```

## Typography

```tsx
// Headings
h1: 'text-3xl font-bold text-gray-900'
h2: 'text-2xl font-bold text-gray-900'
h3: 'text-xl font-semibold text-gray-900'
h4: 'text-lg font-semibold text-gray-900'

// Body
body-lg:   'text-base text-gray-700'
body:      'text-sm text-gray-700'
body-sm:   'text-xs text-gray-600'

// Labels
label:     'text-sm font-medium text-gray-700'
```

## Spacing

```tsx
// Container padding
container: 'px-4 sm:px-6 lg:px-8'

// Card padding
card: 'p-4 sm:p-6'

// Stack spacing (gap)
stack-sm: 'space-y-2'
stack-md: 'space-y-4'
stack-lg: 'space-y-6'

// Inline spacing (gap)
inline-sm: 'gap-2'
inline-md: 'gap-4'
inline-lg: 'gap-6'
```

## Components to Build

### Badge Component
```tsx
interface BadgeProps {
  children: React.ReactNode;
  variant: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  icon?: LucideIcon;
}

export function Badge({ children, variant, icon: Icon }: BadgeProps) {
  const variants = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-orange-100 text-orange-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    neutral: 'bg-gray-100 text-gray-800',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {children}
    </span>
  );
}
```

### Button Component
```tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  className,
  ...props
}: ButtonProps) {
  // Implementation...
}
```

---

**Remember:**
- NO emoticons anywhere in the codebase
- All icons from Lucide React only
- Consistent sizing and colors
- Use semantic color classes
