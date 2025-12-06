# Troubleshooting Guide

## Common Issues and Solutions

### 1. MongoDB Connection Errors

#### Issue: "MongoServerError: connect ECONNREFUSED"
**Cause**: MongoDB is not running or not accessible

**Solutions**:
```powershell
# Check if MongoDB is running
Get-Service -Name "MongoDB"

# Start MongoDB service
net start MongoDB

# Or start MongoDB manually
mongod --dbpath "C:\data\db"
```

**Alternative**: Use MongoDB Atlas (cloud database)
- Sign up at https://www.mongodb.com/cloud/atlas
- Create a free cluster
- Get connection string
- Update `MONGODB_URI` in `.env.local`

---

### 2. Authentication Issues

#### Issue: "Invalid username or password" when logging in
**Solutions**:
- Ensure you've initialized the admin account: `http://localhost:3000/api/init`
- Check `.env.local` for correct `ADMIN_USERNAME` and `ADMIN_PASSWORD`
- Try clearing browser cookies and cache
- Verify MongoDB is running and connected

#### Issue: "Unauthorized" or redirected to login repeatedly
**Solutions**:
- Clear browser cookies
- Check `NEXTAUTH_SECRET` is set in `.env.local`
- Verify `NEXTAUTH_URL` matches your current URL
- Restart the development server

---

### 3. Installation Errors

#### Issue: "npm install" fails
**Solutions**:
```powershell
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
Remove-Item -Recurse -Force node_modules, package-lock.json

# Reinstall
npm install
```

#### Issue: "Cannot find module" errors
**Solutions**:
```powershell
# Reinstall dependencies
npm install

# If still failing, try:
npm ci
```

---

### 4. Build Errors

#### Issue: TypeScript errors during build
**Solutions**:
```powershell
# Check for type errors
npx tsc --noEmit

# Clean build cache
Remove-Item -Recurse -Force .next

# Rebuild
npm run build
```

#### Issue: "Module not found" during build
**Solutions**:
- Check all imports use correct casing
- Verify all required dependencies are in package.json
- Ensure all files are saved
- Restart VS Code or your editor

---

### 5. Environment Variable Issues

#### Issue: Environment variables not loading
**Solutions**:
- Ensure file is named `.env.local` (not `.env.local.txt`)
- Restart the development server after changing .env.local
- Check for typos in variable names
- Ensure no spaces around `=` signs

#### Issue: "NEXTAUTH_SECRET is not defined"
**Solutions**:
```powershell
# Generate a new secret
.\generate-secret.ps1

# Or manually generate:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Add to .env.local:
# NEXTAUTH_SECRET=<generated-secret>
```

---

### 6. Port Already in Use

#### Issue: "Port 3000 is already in use"
**Solutions**:
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or use a different port
$env:PORT=3001; npm run dev
```

---

### 7. Student Index Number Issues

#### Issue: Index numbers not incrementing correctly
**Cause**: Database was cleared or corrupted

**Solutions**:
- Index numbers are generated based on the last student in database
- If database is cleared, numbering restarts from 0000001
- This is expected behavior
- To reset: Clear the `students` collection in MongoDB

---

### 8. Results Not Showing

#### Issue: Student sees "No results found"
**Possible Causes**:
1. No papers created for the class
2. No marks entered for the student
3. Wrong index number entered

**Solutions**:
- Verify papers exist: Admin Dashboard → Class → Papers & Marks tab
- Verify marks entered: Click on paper → Check student has marks
- Verify index number: Check in admin panel student list

#### Issue: Top rankings showing incorrect number
**Cause**: Logic determines top 10 if >10 students, top 5 if ≤10 students

**Solutions**:
- This is expected behavior
- Add more students to see top 10
- Check that results exist for the recent paper

---

### 9. UI/Display Issues

#### Issue: Styles not loading or look broken
**Solutions**:
```powershell
# Rebuild Tailwind
npm run build

# Clear .next cache
Remove-Item -Recurse -Force .next

# Restart dev server
npm run dev
```

#### Issue: Input fields have black outlines on focus
**Check**: This shouldn't happen - our design uses blue focus rings
**Solution**: Clear browser cache and hard reload (Ctrl+Shift+R)

---

### 10. API Errors

#### Issue: "500 Internal Server Error" on API calls
**Solutions**:
- Check browser console for detailed error
- Check terminal for server errors
- Verify MongoDB connection
- Check all required fields are being sent
- Verify user is authenticated (for admin routes)

#### Issue: "401 Unauthorized" on admin routes
**Solutions**:
- Ensure you're logged in
- Check session is valid
- Clear cookies and re-login
- Verify middleware.ts is working

---

### 11. Data Not Saving

#### Issue: Forms submit but data doesn't save
**Solutions**:
- Check browser console for errors
- Check network tab for failed requests
- Verify MongoDB connection
- Check server terminal for errors
- Verify all required fields are filled

#### Issue: Marks not updating
**Solutions**:
- Click "Save" button after entering marks
- Wait for success message or page refresh
- Check network tab for successful response
- Verify you have admin access

---

### 12. Development Server Issues

#### Issue: "Hot reload not working"
**Solutions**:
```powershell
# Restart dev server
# Press Ctrl+C to stop
npm run dev
```

#### Issue: "Changes not reflecting"
**Solutions**:
- Clear browser cache (Ctrl+Shift+R)
- Clear .next folder: `Remove-Item -Recurse -Force .next`
- Restart dev server

---

## Getting Help

### Before Asking for Help:
1. ✅ Check this troubleshooting guide
2. ✅ Check browser console for errors (F12)
3. ✅ Check terminal for server errors
4. ✅ Verify MongoDB is running
5. ✅ Check .env.local is configured correctly
6. ✅ Try restarting the server

### When Reporting Issues:
Include:
- Error message (exact text)
- Browser console errors
- Terminal/server errors
- Steps to reproduce
- What you've tried already

### Useful Commands for Debugging:

```powershell
# Check Node version
node --version

# Check npm version
npm --version

# Check MongoDB status
Get-Service -Name "MongoDB"

# View environment variables
Get-Content .env.local

# Check if port is in use
netstat -ano | findstr :3000

# Test MongoDB connection
mongo --eval "db.version()"

# Clear everything and reinstall
Remove-Item -Recurse -Force node_modules, .next, package-lock.json
npm install
npm run dev
```

---

## Advanced Troubleshooting

### Reset Database
```javascript
// Connect to MongoDB shell
mongo

// Use database
use student-management

// Drop all collections
db.dropDatabase()

// Reinitialize admin
// Visit: http://localhost:3000/api/init
```

### Reset Application
```powershell
# Stop server (Ctrl+C)

# Clear all caches and builds
Remove-Item -Recurse -Force .next, node_modules

# Reinstall dependencies
npm install

# Restart server
npm run dev

# Reinitialize admin
# Visit: http://localhost:3000/api/init
```

### Check Logs
```powershell
# Enable detailed Next.js logging
$env:DEBUG="*"; npm run dev
```

---

## Still Having Issues?

1. Check the README.md for detailed documentation
2. Check QUICKSTART.md for setup instructions
3. Check PROJECT-SUMMARY.md for feature overview
4. Review the code comments in relevant files
5. Check Next.js documentation: https://nextjs.org/docs
6. Check MongoDB documentation: https://docs.mongodb.com/

---

**Remember**: Most issues are related to:
- MongoDB not running (90% of cases)
- Environment variables not set correctly
- Dependencies not installed properly
- Browser cache issues
