# 🎓 CampusSync - Complete Development Checklist

A practical, ordered solo-development roadmap for completing the student-facing Semester 7 module.

**Scope Rule:** Semester 7 covers the student module only. Faculty dashboards, administrator tools, publishing controls, full role management, and institution-wide communication remain Semester 8 work.

---

## 1. Review and stabilize the existing project
- [x] Pull or open the latest CampusSync GitHub repository.
- [x] Create a new branch such as `student-module-development`.
- [x] Run `npm install`, `npm run dev`, and `npm run build`.
- [ ] Verify every existing section and navigation link.
- [ ] List broken layouts, buttons, images, routes, and console errors.
- [x] Remove unused components and duplicated CSS.
- [x] Move API keys and configuration into environment variables.
- [ ] Create a GitHub Project board with To Do, In Progress, Testing, and Done columns.

## 2. Complete the frontend
- [x] Finish the redesigned Student Dashboard.
- [x] Improve responsive layouts for desktop, tablet, and mobile.
- [x] Complete the dashboard views: Overview, Courses, Schedule, Assignments, and AI Assistant.
- [x] Complete Notices and Resources pages.
- [x] Add search, category filters, sorting, and bookmarking.
- [x] Finish Events, Clubs, Community Feed, and Curated for You.
- [x] Add loading skeletons, empty states, error messages, and confirmation messages.
- [x] Replace remaining placeholder dates with 2026 data.
- [x] Check accessibility, keyboard navigation, focus states, and contrast.
- [x] Keep one consistent cinematic academic design across the project.

## 3. Organize the frontend code
- [x] Create reusable components for cards, buttons, modals, forms, loaders, filters, and alerts.
- [x] Configure React Router for every major screen.
- [x] Create a central API service instead of calling APIs directly inside components.
- [x] Create protected routes for signed-in students.
- [x] Keep static data in separate mock-data files until backend integration.
- [x] Add ESLint and formatting rules.
- [x] Recommended folders: components, pages, layouts, services, hooks, context, data, assets, and utils.

## 4. Set up the FastAPI backend
- [x] Create a separate backend folder.
- [x] Install FastAPI, Uvicorn, SQLAlchemy, Pydantic, and required packages.
- [x] Add environment-variable configuration.
- [x] Configure CORS for the React application.
- [x] Create a health-check endpoint.
- [x] Organize routes, models, schemas, services, and database configuration.
- [ ] Test APIs through FastAPI Swagger documentation.

## 5. Design the PostgreSQL database
- [x] Create tables for users and student profiles.
- [x] Create tables for courses, notices, academic resources, events, and clubs.
- [x] Create tables for assignments, deadlines, saved items, and community posts.
- [x] Create tables for notifications, chat sessions, chat messages, and ingested documents.
- [x] Create an ER diagram.
- [x] Add primary keys, foreign keys, timestamps, and indexes.
- [x] Insert realistic demonstration data.
- [x] Add database migrations.

## 6. Implement authentication
- [x] Use Firebase Authentication for identity and PostgreSQL for student profile information.
- [x] Implement student registration, email/password login, logout, and password reset.
- [x] Maintain the login session after page refresh.
- [x] Protect student dashboard routes.
- [x] Verify Firebase authentication tokens in FastAPI.
- [ ] Implement student profile creation and editing.
- [x] Add input validation and readable authentication errors.
- [x] Update the React app to send the JWT in the Authorization header.

## 7. Build the core APIs
- [x] Student profile API.
- [x] Dashboard summary API.
- [x] Courses API.
- [x] Notices and resources APIs.
- [x] Events and clubs APIs.
- [x] Assignments API.
- [x] Saved-items API.
- [x] Community-post API.
- [x] Notifications API.
- [x] Support only the operations required by the current student interface.

## 8. Build the notice and resource collection system
- [x] Identify official BTU and college information sources.
- [x] Scrape simple pages using BeautifulSoup.
- [x] Use Playwright only where JavaScript rendering is required.
- [x] Extract text from uploaded or downloaded PDFs.
- [x] Save the title, date, category, source URL, content, and document type.
- [x] Prevent duplicate notices.
- [x] Add search and filtering.
- [x] Display the original source link for verification.
- [x] Add a manual refresh or import option for the project demonstration.

## 9. Connect the frontend to the backend
- [x] Replace mock dashboard data with live API data.
- [x] Connect login and registration.
- [x] Connect courses, notices, events, assignments, and resources.
- [x] Add API loading and failure states.
- [ ] Handle expired login sessions.
- [ ] Test every frontend form.
- [ ] Ensure page refreshes do not lose required state.

## 10. Build the CampusSync RAG system
- [ ] Do not train a large language model from scratch.
- [ ] Clean the extracted notice and resource text.
- [ ] Divide documents into useful chunks.
- [ ] Generate embeddings and store them in one vector database: ChromaDB.
- [ ] Retrieve the most relevant chunks for each question.
- [ ] Send the retrieved context and question to Gemini.
- [ ] Return answers with document titles and original source links.
- [ ] Add conversation history and suggested questions.
- [ ] Prevent the chatbot from inventing unsupported answers.
- [ ] Show a clear no-information response when evidence is missing.

## 11. Add personalization and alerts
- [ ] Start with simple rule-based logic instead of complex machine learning.
- [ ] Save the student's branch, semester, courses, clubs, and interests.
- [ ] Recommend relevant notices, resources, clubs, and events.
- [ ] Display upcoming assignments and exams.
- [ ] Add due-soon and new-notice indicators.
- [ ] Add a personalized Curated for You section.
- [ ] Allow students to save or dismiss recommendations.

## 12. Testing and security
- [ ] Test backend endpoints.
- [ ] Test registration, login, logout, and protected routes.
- [ ] Test scraping and duplicate detection.
- [ ] Test document retrieval and chatbot responses.
- [ ] Test mobile and desktop layouts.
- [ ] Validate all user inputs and sanitize community post content.
- [ ] Add API rate limiting where appropriate.
- [ ] Keep Firebase, Gemini, and database secrets out of GitHub.
- [ ] Add friendly 404 and error pages.
- [ ] Ask classmates to perform user testing and record their feedback.

## 13. Deployment
- [ ] Deploy the React frontend on Vercel.
- [ ] Deploy FastAPI on Render or Railway.
- [ ] Use a managed PostgreSQL database.
- [ ] Configure persistent vector-database storage.
- [ ] Add production environment variables.
- [ ] Update frontend API URLs.
- [ ] Test authentication and CORS after deployment.
- [ ] Test the complete deployed workflow.
- [ ] Add the live website link to GitHub.

## 14. Documentation and final presentation
- [ ] Update the README with installation and deployment steps.
- [ ] Create the system architecture diagram, database ER diagram, and RAG workflow diagram.
- [ ] Document all API endpoints.
- [ ] Prepare screenshots of every major module.
- [ ] Complete the 14-week progress report.
- [ ] Update the CampusSync presentation.
- [ ] Prepare a short demonstration script.
- [ ] Prepare questions and answers for the final project defence.
- [ ] Record known limitations and Semester 8 future scope.

---

## 📅 Recommended Weeks 6-14 Plan
| Week | Main Work | Completion Target |
| :--- | :--- | :--- |
| **6** | Dashboard redesign and frontend stabilization | Responsive, error-free frontend build |
| **7** | FastAPI setup and PostgreSQL database | Backend health check, schema, and migrations |
| **8** | Firebase authentication and student profiles | Registration, login, protected routes, profile |
| **9** | Notices, resources, scraping, and PDF processing | Searchable verified campus information |
| **10** | Core APIs and frontend integration | Live data replacing frontend mocks |
| **11** | Embeddings, ChromaDB, and retrieval | Relevant document chunks retrieved reliably |
| **12** | Gemini RAG chatbot, personalization, and alerts | Grounded answers and useful student recommendations |
| **13** | Testing, security, bug fixing, and deployment | Stable live full-stack application |
| **14** | Documentation, report, presentation, and demo | Submission-ready project package |

## 🚫 Keep Outside Current Scope
- Faculty and administrator dashboards.
- A separate mobile application.
- Full university ERP integration.
- Training a custom large language model.
- Complex machine-learning recommendations.
- Multiple vector databases.
- Real-time chat and video calling.
- Payment processing or attendance hardware integration.
