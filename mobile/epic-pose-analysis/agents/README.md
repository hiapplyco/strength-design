# Strength.Design Mobile App Development Agents

## 🤖 Agent Architecture

This directory contains specialized AI agents for mobile app development, testing, and optimization. Each agent has specific responsibilities and can spawn sub-agents for complex tasks.

## 📊 Agent Hierarchy

```
agents/
├── master-agent.yaml         # Orchestrates all other agents
├── mobile-dev/               # Mobile development specialists
│   ├── ui-agent.yaml        # UI/UX implementation
│   ├── state-agent.yaml     # State management
│   └── navigation-agent.yaml # Navigation flows
├── quality/                  # Quality assurance agents
│   ├── testing-agent.yaml   # Automated testing
│   ├── performance-agent.yaml # Performance optimization
│   └── security-agent.yaml  # Security auditing
├── integration/              # Integration specialists
│   ├── firebase-agent.yaml  # Firebase services
│   ├── api-agent.yaml       # API integration
│   └── sync-agent.yaml      # Data synchronization
├── analytics/                # Analytics and monitoring
│   ├── telemetry-agent.yaml # Usage tracking
│   ├── crash-agent.yaml     # Crash reporting
│   └── metrics-agent.yaml   # Performance metrics
└── release/                  # Release management
    ├── build-agent.yaml     # Build automation
    ├── deploy-agent.yaml    # Deployment
    └── monitor-agent.yaml   # Production monitoring

## 🎯 Agent Responsibilities

### Master Agent
- Coordinates all other agents
- Prioritizes tasks based on impact
- Manages agent communication
- Reports progress to developers

### Mobile Development Agents
- **UI Agent**: Component development, styling, animations
- **State Agent**: Redux/Context management, data flow
- **Navigation Agent**: Screen flows, deep linking, routing

### Quality Agents
- **Testing Agent**: Unit tests, integration tests, E2E tests
- **Performance Agent**: Bundle size, render optimization, memory usage
- **Security Agent**: Auth flows, data encryption, API security

### Integration Agents
- **Firebase Agent**: Firestore queries, Functions, Auth
- **API Agent**: REST/GraphQL integration, error handling
- **Sync Agent**: Offline support, conflict resolution

### Analytics Agents
- **Telemetry Agent**: User behavior tracking, feature usage
- **Crash Agent**: Error boundaries, Sentry integration
- **Metrics Agent**: Performance monitoring, load times

### Release Agents
- **Build Agent**: CI/CD pipelines, build optimization
- **Deploy Agent**: App store submissions, OTA updates
- **Monitor Agent**: Production health, user feedback

## 🚀 Usage

Each agent can be invoked with specific tasks:

```bash
# Invoke UI agent for component development
agent invoke mobile-dev/ui-agent --task "Create exercise card component"

# Invoke testing agent for test coverage
agent invoke quality/testing-agent --task "Add tests for workout tracker"

# Invoke performance agent for optimization
agent invoke quality/performance-agent --task "Optimize exercise search"
```

## 📋 Task Queue

Agents maintain a shared task queue with priorities:

1. **Critical**: Production bugs, security issues
2. **High**: Feature completion, performance issues
3. **Medium**: UI improvements, refactoring
4. **Low**: Documentation, minor enhancements

## 🔄 Agent Communication

Agents communicate through:
- Shared state in `/agents/state/`
- Message queue in `/agents/messages/`
- Task results in `/agents/results/`

## 📈 Performance Tracking

Each agent tracks:
- Tasks completed
- Time per task
- Success rate
- Error frequency
- Resource usage