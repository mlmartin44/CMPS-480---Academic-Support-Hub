// backend/homeapi.js

const homeData = {
  welcome: 'Welcome to the Academic Support Hub',
  announcements: [
    { id: 1, msg: 'UC-2 Q&A endpoints ready for testing' },
    { id: 2, msg: 'Planner tasks due this weekend' }
  ],
  highlights: {
    questions: 12,
    resources: 7,
    tasks: 4
  }
};

export default homeData;
