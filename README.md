# Interactive Route Planning

An interactive web application for visualizing and planning routes on a map interface. This tool allows users to find optimal paths between locations using various pathfinding algorithms.

## Features

- Interactive map interface for route planning
- Multiple pathfinding algorithms (Dijkstra, A*, etc.)
- Real-time visualization of the pathfinding process
- Customizable map settings and obstacles
- Responsive design for desktop and mobile devices

## Demo


## Technologies Used

- React.js
- TypeScript
- HTML5/CSS3
- Pathfinding algorithms
- Modern JavaScript (ES6+)

## Getting Started

### Prerequisites

- Node.js (v14.0.0 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/interactive-path-finder-ui.git
   cd interactive-path-finder-ui
   ```
2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```
3. Start the development server:
   ```bash
   npm start
   # or
   yarn start
   ```
4. Open your browser and visit

##Usage

- Click on the map to set a starting point
- Click again to set a destination
- Select a pathfinding algorithm from the dropdown menu
- Click "Find Path" to visualize the route
- Use the controls to adjust speed, add obstacles, or clear the map

##Algorithms Implemented

### Dijkstra's Algorithm
Guarantees the shortest path by exploring all possible routes from the starting point.

### A* (A-Star)
An extension of Dijkstra's algorithm that uses heuristics to guide the search toward the goal, typically resulting in faster pathfinding.

### Breadth-First Search (BFS)
Explores all neighbor nodes at the present depth before moving to nodes at the next depth level.

### Depth-First Search (DFS)
Explores as far as possible along each branch before backtracking.

##Project Structure
```bash
interactive-path-finder-ui/
├── public/
├── src/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── models/
│   ├── pages/
│   ├── utils/
│   ├── App.css
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx            
├── components.json              # Components configuration
├── eslint.config.js             # ESLint configuration
├── index.html                   # HTML entry point          
├── package.json                 # Project dependencies and scripts
├── postcss.config.js            # PostCSS configuration
├── README.md                    # Project documentation
├── tailwind.config.ts           # Tailwind CSS configuration
├── tsconfig.app.json            # TypeScript app configuration
├── tsconfig.json                # TypeScript configuration
├── tsconfig.node.json           # TypeScript Node configuration
└── vite.config.ts  
```

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch
3. Commit your changes
4. Push to the branch 
5. Open a Pull Request

## Acknowledgments
- React.js for the frontend framework
- TypeScript for type safety
- All contributors who have helped with code, suggestions, and bug reports

## Contact
Your Name - @rajveerkhanduja - rajveerkhanduja74@gmail.com
Project Link: https://github.com/SurajMandal14/interactive-path-finder-ui