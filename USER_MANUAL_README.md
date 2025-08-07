# User Manual Generation System

## Overview
This directory contains a comprehensive user manual generation system for the Computerized Stationary Management System (PSO Inventory Management). Two Python scripts have been created to generate professional user manuals in Word (.docx) format.

## Generated Files

### 📄 User_Manual.docx
- **Complete user manual** for the inventory management system
- Professional formatting with cover page and table of contents
- Comprehensive coverage of all system features
- Ready for distribution to end users

## Python Scripts

### 🔧 generate_user_manual.py
**Advanced screenshot-based generator**
- Uses Selenium WebDriver for automated browser interaction
- Captures screenshots of all application pages
- Embeds images directly into the Word document
- Requires development server to be running (`npm run dev`)
- Handles authentication and navigation automatically
- Creates professional manual with visual documentation

**Features:**
- Automatic screenshot capture
- Login simulation for authenticated pages
- Image optimization and embedding
- Error handling for server connectivity
- Graceful fallback when server unavailable

### 🔧 create_manual_basic.py
**Text-based generator (no screenshots required)**
- Creates comprehensive manual without requiring running server
- Faster generation process
- Professional formatting and structure
- Detailed descriptions of all features
- Ideal for quick documentation generation

**Features:**
- No server dependency
- Fast execution
- Complete feature coverage
- Professional Word document formatting
- Detailed step-by-step instructions

## Usage Instructions

### Option 1: Basic Manual (Recommended for quick generation)
```bash
python create_manual_basic.py
```
- ✅ No server required
- ✅ Fast execution
- ✅ Complete documentation
- ❌ No screenshots

### Option 2: Advanced Manual with Screenshots
```bash
# First, start the development server
npm run dev

# Then run the screenshot generator
python generate_user_manual.py
```
- ✅ Includes screenshots
- ✅ Visual documentation
- ✅ Automated page capture
- ❌ Requires running server
- ❌ Longer execution time

## Dependencies

Both scripts automatically install required packages:
- `python-docx` - Word document creation
- `selenium` - Browser automation (for screenshot version)
- `Pillow` - Image processing
- `requests` - HTTP requests for server checking

## Manual Content Structure

The generated user manual includes:

1. **Cover Page** - Professional title page with PSO branding
2. **Table of Contents** - Organized navigation
3. **Introduction** - System overview and key features
4. **Getting Started** - System requirements and initial setup
5. **Authentication System** - Login/signup procedures
6. **Dashboard Overview** - Main interface navigation
7. **Inventory Management** - Core functionality
   - Inventory Overview
   - Current Stock Management
   - Stock History Tracking
   - Adding New Items
8. **Email Management** - Communication features
9. **User Profile Management** - Account settings
10. **Troubleshooting** - Common issues and solutions
11. **System Requirements** - Technical specifications
12. **Appendix** - Additional resources and information

## Key Features Documented

### Authentication
- Secure login/signup process
- Session management
- Password requirements
- Security best practices

### Inventory Management
- Real-time stock tracking
- Add/edit/delete items
- Stock history and audit trail
- Search and filtering capabilities
- Bulk operations

### Dashboard Analytics
- Real-time statistics
- Interactive charts
- Recent activity tracking
- Key performance indicators

### Email System
- Automated notifications
- Low stock alerts
- Email configuration
- Template management

### Security Features
- Role-based access control
- Session timeout
- Data encryption
- Audit logging

## Technical Details

### System Architecture
- Next.js frontend framework
- React component library
- Supabase backend database
- Real-time data synchronization
- Cloud-based infrastructure

### Browser Compatibility
- Chrome 90+ (recommended)
- Firefox 88+
- Safari 14+
- Edge 90+

### Security Implementation
- HTTPS encryption
- JWT token authentication
- Role-based permissions
- Session management
- Data validation

## Support Information

The manual includes comprehensive troubleshooting sections covering:
- Login issues
- Performance problems
- Email delivery issues
- Browser compatibility
- Network connectivity
- Data synchronization

## Quality Assurance

Both generators have been tested and verified to:
- ✅ Create properly formatted Word documents
- ✅ Include all necessary content sections
- ✅ Handle errors gracefully
- ✅ Generate professional documentation
- ✅ Work on Windows environment
- ✅ Install dependencies automatically

## Maintenance

To update the manual:
1. Modify the content in the respective Python script
2. Run the generator to create updated documentation
3. Distribute the new User_Manual.docx file

The manual generation system is designed to be maintainable and extensible for future updates to the inventory management system.