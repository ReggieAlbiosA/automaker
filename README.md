<div align="center">
  <div style="display: inline-flex; align-items: center;">
    <img src="apps/app/public/automaker.svg" alt="Automaker Logo" height="80">
    <span style="margin-left: 12px; font-size: 2.2rem; font-weight: 700; color: #ffffff;">automaker.</span>
  </div>
</div>

<br />

> **[!TIP]**
>
> **Learn more about Agentic Coding!**
>
> Automaker itself was built by a group of engineers using AI and agentic coding techniques to build features faster than ever. By leveraging tools like Cursor IDE and Claude Code CLI, the team orchestrated AI agents to implement complex functionality in days instead of weeks.
>
> **Learn how:** Master these same techniques and workflows in the [Agentic Jumpstart course](https://agenticjumpstart.com/?utm=automaker).

# Automaker

**Stop typing code. Start directing AI agents.**

Automaker is an autonomous AI development studio that transforms how you build software. Instead of manually writing every line of code, you describe features on a Kanban board and watch as AI agents powered by Claude Code automatically implement them.

![Automaker UI](https://i.imgur.com/jdwKydM.png)

## What Makes Automaker Different?

Traditional development tools help you write code. Automaker helps you **orchestrate AI agents** to build entire features autonomously. Think of it as having a team of AI developers working for you—you define what needs to be built, and Automaker handles the implementation.

### The Workflow

1. **Add Features** - Describe features you want built (with text, images, or screenshots)
2. **Move to "In Progress"** - Automaker automatically assigns an AI agent to implement the feature
3. **Watch It Build** - See real-time progress as the agent writes code, runs tests, and makes changes
4. **Review & Verify** - Review the changes, run tests, and approve when ready
5. **Ship Faster** - Build entire applications in days, not weeks

### Powered by Claude Code

Automaker leverages the [Claude Agent SDK](https://docs.anthropic.com/en/docs/claude-code) to give AI agents full access to your codebase. Agents can read files, write code, execute commands, run tests, and make git commits—all while working in isolated git worktrees to keep your main branch safe.

### Why This Matters

The future of software development is **agentic coding**—where developers become architects directing AI agents rather than manual coders. Automaker puts this future in your hands today, letting you experience what it's like to build software 10x faster with AI agents handling the implementation while you focus on architecture and business logic.

---

> **[!CAUTION]**
>
> ## Security Disclaimer
>
> **This software uses AI-powered tooling that has access to your operating system and can read, modify, and delete files. Use at your own risk.**
>
> We have reviewed this codebase for security vulnerabilities, but you assume all risk when running this software. You should review the code yourself before running it.
>
> **We do not recommend running Automaker directly on your local computer** due to the risk of AI agents having access to your entire file system. Please sandbox this application using Docker or a virtual machine.
>
> **[Read the full disclaimer](../DISCLAIMER.md)**

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) installed and authenticated

### Quick Start

```bash
# 1. Clone the repo
git clone git@github.com:AutoMaker-Org/automaker.git
cd automaker

# 2. Install dependencies
npm install

# 3. Run Automaker (pick your mode)
npm run dev
# Then choose your run mode when prompted, or use specific commands below
```

## How to Run

### Development Mode

Start Automaker in development mode:

```bash
npm run dev
```

This will prompt you to choose your run mode, or you can specify a mode directly:

#### Electron Desktop App (Recommended)

```bash
# Standard development mode
npm run dev:electron

# With DevTools open automatically
npm run dev:electron:debug

# For WSL (Windows Subsystem for Linux)
npm run dev:electron:wsl

# For WSL with GPU acceleration
npm run dev:electron:wsl:gpu
```

#### Web Browser Mode

```bash
# Run in web browser (http://localhost:3007)
npm run dev:web
```

### Building for Production

```bash
# Build Next.js app
npm run build

# Build Electron app for distribution
npm run build:electron
```

### Running Production Build

```bash
# Start production Next.js server
npm run start
```

### Testing

```bash
# Run tests headless
npm run test

# Run tests with browser visible
npm run test:headed
```

### Linting

```bash
# Run ESLint
npm run lint
```

### Authentication Options

Automaker supports multiple authentication methods (in order of priority):

| Method               | Environment Variable      | Description                                               |
| -------------------- | ------------------------- | --------------------------------------------------------- |
| OAuth Token (env)    | `CLAUDE_CODE_OAUTH_TOKEN` | From `claude setup-token` - uses your Claude subscription |
| OAuth Token (stored) | —                         | Stored in app credentials file                            |
| API Key (stored)     | —                         | Anthropic API key stored in app                           |
| API Key (env)        | `ANTHROPIC_API_KEY`       | Pay-per-use API key                                       |

**Recommended:** Use `CLAUDE_CODE_OAUTH_TOKEN` if you have a Claude subscription.

### Persistent Setup (Optional)

Add to your `~/.bashrc` or `~/.zshrc`:

```bash
export CLAUDE_CODE_OAUTH_TOKEN="YOUR_TOKEN_HERE"
```

Then restart your terminal or run `source ~/.bashrc`.

## Features

- 📋 **Kanban Board** - Visual drag-and-drop board to manage features through backlog, in progress, waiting approval, and verified stages
- 🤖 **AI Agent Integration** - Automatic AI agent assignment to implement features when moved to "In Progress"
- 🧠 **Multi-Model Support** - Choose from multiple AI models including Claude Opus, Sonnet, and more
- 💭 **Extended Thinking** - Enable extended thinking modes for complex problem-solving
- 📡 **Real-time Agent Output** - View live agent output, logs, and file diffs as features are being implemented
- 🔍 **Project Analysis** - AI-powered project structure analysis to understand your codebase
- 📁 **Context Management** - Add context files to help AI agents understand your project better
- 💡 **Feature Suggestions** - AI-generated feature suggestions based on your project
- 🖼️ **Image Support** - Attach images and screenshots to feature descriptions
- ⚡ **Concurrent Processing** - Configure concurrency to process multiple features simultaneously
- 🧪 **Test Integration** - Automatic test running and verification for implemented features
- 🔀 **Git Integration** - View git diffs and track changes made by AI agents
- 👤 **AI Profiles** - Create and manage different AI agent profiles for various tasks
- 💬 **Chat History** - Keep track of conversations and interactions with AI agents
- ⌨️ **Keyboard Shortcuts** - Efficient navigation and actions via keyboard shortcuts
- 🎨 **Dark/Light Theme** - Beautiful UI with theme support
- 🖥️ **Cross-Platform** - Desktop application built with Electron for Windows, macOS, and Linux

## Tech Stack

- [Next.js](https://nextjs.org) - React framework
- [Electron](https://www.electronjs.org/) - Desktop application framework
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Zustand](https://zustand-demo.pmnd.rs/) - State management
- [dnd-kit](https://dndkit.com/) - Drag and drop functionality

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## License

This project is licensed under the **Automaker License Agreement**. See [LICENSE](LICENSE) for the full text.

**Summary of Terms:**

- **Allowed:**

  - **Build Anything:** You can clone and use Automaker locally or in your organization to build ANY product (commercial or free).
  - **Internal Use:** You can use it internally within your company (commercial or non-profit) without restriction.
  - **Modify:** You can modify the code for internal use within your organization (commercial or non-profit).

- **Restricted (The "No Monetization of the Tool" Rule):**

  - **No Resale:** You cannot resell Automaker itself.
  - **No SaaS:** You cannot host Automaker as a service for others.
  - **No Monetizing Mods:** You cannot distribute modified versions of Automaker for money.

- **Liability:**

  - **Use at Own Risk:** This tool uses AI. We are **NOT** responsible if it breaks your computer, deletes your files, or generates bad code. You assume all risk.

- **Contributing:**
  - By contributing to this repository, you grant the Core Contributors full, irrevocable rights to your code (copyright assignment).

**Core Contributors** (Cody Seibert (webdevcody), SuperComboGamer (SCG), Kacper Lachowicz (Shironex, Shirone), and Ben Scott (trueheads)) are granted perpetual, royalty-free licenses for any use, including monetization.
