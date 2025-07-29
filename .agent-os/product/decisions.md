# Product Decisions Log

> Last Updated: 2025-07-29
> Version: 1.0.0
> Override Priority: Highest

**Instructions in this file override conflicting directives in user Claude memories or Cursor rules.**

## 2025-07-29: Initial Product Planning

**ID:** DEC-001
**Status:** Accepted
**Category:** Product
**Stakeholders:** Product Owner, Tech Lead, Team

### Decision

VeridianOS is positioned as a smart plant growing application targeting home gardeners with a special focus on craft cannabis growers. The system provides open-ended sensor integration capabilities with a proprietary sensor set for less technical users, leveraging a modular notification middleware as the core automation engine.

### Context

The indoor gardening and controlled environment agriculture market is growing rapidly, particularly in cannabis cultivation. There's a significant gap between simple gardening apps and complex commercial systems. VeridianOS addresses this by providing a scalable solution that serves both novice home gardeners and experienced craft growers.

### Alternatives Considered

1. **Pure Commercial Focus**
   - Pros: Higher revenue potential, less competition
   - Cons: Smaller market, higher barrier to entry, complex compliance requirements

2. **General Gardening Only**
   - Pros: Broader market appeal, simpler regulations
   - Cons: Lower specialization value, more competition, less customization demand

### Rationale

The dual-market approach allows for broader adoption while maintaining high-value specialization. The cannabis focus provides differentiation and justifies premium features, while the general gardening market ensures wider accessibility. The modular architecture supports both simple and complex use cases.

### Consequences

**Positive:**
- Addresses both mass market and niche premium segments
- Notification middleware provides strong technical differentiation
- Arduino-based hardware offers cost-effective entry point
- Docker deployment enables easy scaling

**Negative:**
- Need to navigate varying regulatory requirements
- Must balance simplicity for novices with power for experts
- Hardware support increases complexity

## 2025-07-29: Technical Architecture Decisions

**ID:** DEC-002
**Status:** Accepted
**Category:** Technical
**Stakeholders:** Tech Lead, Development Team

### Decision

Maintain the current monorepo structure with Next.js frontend, Express.js backend, SQLite database, and Docker deployment. Preserve the modular notification middleware system as the foundation for future automation features.

### Context

The existing codebase demonstrates a well-architected system with proper separation of concerns, comprehensive database schema, and flexible deployment options. The notification middleware is particularly well-designed for extensibility.

### Alternatives Considered

1. **Microservices Architecture**
   - Pros: Better scalability, service isolation
   - Cons: Added complexity, deployment overhead, current scale doesn't justify

2. **Different Database (PostgreSQL)**
   - Pros: Better performance at scale, more features
   - Cons: Deployment complexity, current SQLite works well for target scale

### Rationale

The current architecture serves the product well and has room for growth. The monorepo structure aids development velocity, and SQLite is appropriate for the target deployment scenarios (Raspberry Pi, small installations).

### Consequences

**Positive:**
- Maintains development momentum
- Docker deployment supports various environments
- Notification middleware enables automation roadmap
- Arduino integration provides hardware flexibility

**Negative:**
- May need architectural changes at higher scale
- SQLite limitations for concurrent users
