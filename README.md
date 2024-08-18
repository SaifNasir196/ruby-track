after cloning the repo, run:

for the frontend:
```bash
cd frontend
npm install
npm run dev
```
the backend should be accessible via: http://localhost:3000

for the backend:
```bash
cd backend
bundle install --gemfile
$env:EDITOR = "code --wait"
rails credentials:edit
rails server
```
the backend should be accessible via: http://localhost:3001