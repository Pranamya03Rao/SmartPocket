# Development Conventions & Feature Blueprint

When implementing any new feature in this repository, follow this exact 6-step lifecycle.

---

## The 6-Step Pattern

### Step 1: Mongoose Model (`server/models/<Feature>.js`)
- Always include `user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }`.
- Add compound indexes for frequent tenant-scoped queries.

### Step 2: Zod Validation (`server/validations/schemas.js`)
- Create strict schemas for inputs.
- Strip unknown keys or sanitize fields before database write.

### Step 3: Controller (`server/controllers/<feature>Controller.js`)
- Enforce tenant isolation in every query: `{ _id: req.params.id, user: req.user._id }`.
- Use `AppError(message, statusCode)` for operational errors.
- Wrap handler bodies in `try ... catch (err) { next(err); }`.

### Step 4: Route (`server/routes/<feature>Routes.js`)
- Mount `authenticate` at the router level.
- Attach `verifyCsrf` on state-changing verbs (`POST`, `PATCH`, `DELETE`).
- Apply `validate(schema)` middleware.

### Step 5: Client API Call (`client/src/api/client.js` or page)
- Use configured `api` axios instance. It automatically handles `X-CSRF-Token` headers and 401 token refresh.

### Step 6: Frontend View (`client/src/pages/<Feature>.jsx`)
- Use Tailwind utility classes with dark mode variants (`dark:...`).
- Handle loading, empty, and error states gracefully.

---

## Worked Example: Savings Goal Feature

### 1. Model (`server/models/Goal.js`)
```javascript
const goalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  target: { type: Number, required: true },
  saved: { type: Number, default: 0 },
  deadline: { type: Date, required: true }
});
export default mongoose.model('Goal', goalSchema);
```

### 2. Zod Schema (`server/validations/schemas.js`)
```javascript
export const createGoalSchema = z.object({
  name: z.string().min(1).max(200),
  target: z.number().positive(),
  deadline: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
});
```

### 3. Controller (`server/controllers/goalController.js`)
```javascript
export async function createGoal(req, res, next) {
  try {
    const goal = await Goal.create({ ...req.validated, user: req.user._id });
    res.status(201).json({ goal });
  } catch (err) { next(err); }
}

export async function getGoals(req, res, next) {
  try {
    const goals = await Goal.find({ user: req.user._id });
    res.json({ goals });
  } catch (err) { next(err); }
}
```

### 4. Route (`server/routes/goalRoutes.js`)
```javascript
const router = Router();
router.use(authenticate);
router.get('/', getGoals);
router.post('/', verifyCsrf, validate(createGoalSchema), createGoal);
export default router;
```

### 5. Client API Call (`client/src/pages/Goals.jsx`)
```javascript
import { api } from '../api/client.js';

// Fetch
const { data } = await api.get('/goals');

// Create
await api.post('/goals', {
  name: 'Laptop Fund',
  target: 60000,
  deadline: '2026-12-31'
});
```
