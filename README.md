# Astrolune Client UI

React-based UI monorepo for Astrolune desktop client.

## Structure

```
client-ui/
├── packages/
│   ├── app/          # Main application UI
│   └── splash/       # Splash screen loader
├── package.json      # Root workspace configuration
└── pnpm-workspace.yaml
```

## Packages

### @astrolune/app
Main application interface with full Discord-like functionality:
- Authentication flows
- Server/channel navigation
- Real-time messaging
- Voice channels
- User settings

### @astrolune/splash
Lightweight splash screen shown during application startup:
- Loading animations
- Initialization status
- Minimal dependencies

## Development

### Prerequisites
- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Setup
```bash
# Install dependencies
pnpm install

# Run all packages in dev mode
pnpm dev

# Build all packages
pnpm build

# Lint all packages
pnpm lint

# Type check all packages
pnpm typecheck
```

### Working with individual packages
```bash
# Run specific package
pnpm --filter @astrolune/app dev
pnpm --filter @astrolune/splash build

# Add dependency to specific package
pnpm --filter @astrolune/app add react-query
```

## Technology Stack

- **Framework**: React 18/19
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: SCSS/CSS Modules
- **State Management**: Redux Toolkit
- **Routing**: React Router
- **Package Manager**: pnpm (workspaces)

## Build Output

Each package builds to its own `dist/` directory:
- `packages/app/dist/` - Main app bundle
- `packages/splash/dist/` - Splash screen bundle

These are consumed by the WPF host via WebView2.

## Integration with Desktop

The Astrolune.Desktop repository includes this as a submodule:
```bash
# In Astrolune.Desktop
git submodule add https://github.com/Astrolune/client-ui.git ui
git submodule update --init --recursive
```

The WPF host loads built assets from `ui/packages/*/dist/`.

## Contributing

### Adding a new package
1. Create directory in `packages/`
2. Add `package.json` with name `@astrolune/package-name`
3. Ensure it has `build`, `dev`, and `lint` scripts
4. Update this README

### Code style
- Use TypeScript strict mode
- Follow existing ESLint configuration
- Write functional components with hooks
- Keep components small and focused

## CI/CD

GitHub Actions automatically:
- Installs dependencies with pnpm
- Runs type checking
- Runs linting
- Builds all packages
- Caches node_modules for faster builds

See `.github/workflows/build.yml` for details.

## License

MIT
