# 🐙 GitHub Setup Instructions

## Step 1: Create Repository on GitHub
1. Go to https://github.com
2. Click "New repository" (green button)
3. Repository name: `healthhq-quackchallenge`
4. Description: "A fun, gamified health challenge platform 🦆"
5. Keep it Public (recommended for open source)
6. **DO NOT** check "Add a README file" (we already have one)
7. Click "Create repository"

## Step 2: Connect Local Repository
After creating the GitHub repository, run these commands:

```bash
# Add GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/healthhq-quackchallenge.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 3: Verify Connection
```bash
# Check remote connection
git remote -v

# Check repository status
git status
```

## Alternative: Using SSH (More Secure)
If you have SSH keys set up:

```bash
# Add SSH remote instead
git remote add origin user@example.com:YOUR_USERNAME/healthhq-quackchallenge.git

# Push to GitHub
git push -u origin main
```

## Step 4: Update Repository URL in package.json
After creating the GitHub repo, update the URLs in package.json:

```json
{
  "repository": {
    "type": "git",
    "url": "https://github.com/YOUR_USERNAME/healthhq-quackchallenge.git"
  },
  "bugs": {
    "url": "https://github.com/YOUR_USERNAME/healthhq-quackchallenge/issues"
  },
  "homepage": "https://github.com/YOUR_USERNAME/healthhq-quackchallenge#readme"
}
```

## 🎉 You're Ready!
Once connected, you can:
- Push code changes: `git push`
- Create issues and track bugs
- Set up GitHub Actions for CI/CD
- Collaborate with others
- Deploy using GitHub Pages or other services

## 🦆 Next Steps After GitHub Setup:
1. Install dependencies: `npm install`
2. Start development: `npm run dev`
3. Connect iPhone health data: `npm run health:sync`
4. Create your first health challenge!
