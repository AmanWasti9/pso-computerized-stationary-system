#!/usr/bin/env python3
"""
User Manual Generator for Inventory Management System
This script automatically generates a comprehensive user manual with screenshots.
"""

import os
import time
import sys
from datetime import datetime
from pathlib import Path

try:
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.common.action_chains import ActionChains
except ImportError:
    print("Installing selenium...")
    os.system("pip install selenium")
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.common.action_chains import ActionChains

try:
    from docx import Document
    from docx.shared import Inches, Pt
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.enum.style import WD_STYLE_TYPE
    from docx.oxml.shared import OxmlElement, qn
except ImportError:
    print("Installing python-docx...")
    os.system("pip install python-docx")
    from docx import Document
    from docx.shared import Inches, Pt
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.enum.style import WD_STYLE_TYPE
    from docx.oxml.shared import OxmlElement, qn

try:
    from PIL import Image
except ImportError:
    print("Installing Pillow...")
    os.system("pip install Pillow")
    from PIL import Image

class UserManualGenerator:
    def __init__(self, base_url="http://localhost:3000"):
        self.base_url = base_url
        self.driver = None
        self.doc = Document()
        self.screenshots_dir = Path("screenshots")
        self.screenshots_dir.mkdir(exist_ok=True)
        
        # Test credentials (you may need to adjust these)
        self.test_email = "wastiaman123@gmail.com"
        self.test_password = "polo0987"
        
    def setup_driver(self):
        """Setup Chrome WebDriver with appropriate options"""
        chrome_options = Options()
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument("--disable-gpu")
        
        try:
            self.driver = webdriver.Chrome(options=chrome_options)
            self.driver.maximize_window()
            print("Chrome WebDriver initialized successfully")
        except Exception as e:
            print(f"Error initializing Chrome WebDriver: {e}")
            print("Please ensure Chrome and ChromeDriver are installed")
            sys.exit(1)
    
    def take_screenshot(self, filename, element=None):
        """Take a screenshot and save it"""
        try:
            screenshot_path = self.screenshots_dir / f"{filename}.png"
            
            if element:
                # Screenshot of specific element
                element.screenshot(str(screenshot_path))
            else:
                # Full page screenshot
                self.driver.save_screenshot(str(screenshot_path))
            
            # Optimize image size
            with Image.open(screenshot_path) as img:
                # Resize if too large
                if img.width > 1200:
                    ratio = 1200 / img.width
                    new_height = int(img.height * ratio)
                    img = img.resize((1200, new_height), Image.Resampling.LANCZOS)
                    img.save(screenshot_path, optimize=True, quality=85)
            
            print(f"Screenshot saved: {screenshot_path}")
            return screenshot_path
        except Exception as e:
            print(f"Error taking screenshot {filename}: {e}")
            return None
    
    def wait_for_element(self, by, value, timeout=10):
        """Wait for an element to be present"""
        try:
            return WebDriverWait(self.driver, timeout).until(
                EC.presence_of_element_located((by, value))
            )
        except Exception as e:
            print(f"Element not found: {by}={value}, Error: {e}")
            return None
    
    def wait_for_page_load(self, timeout=10):
        """Wait for page to load completely"""
        try:
            WebDriverWait(self.driver, timeout).until(
                lambda driver: driver.execute_script("return document.readyState") == "complete"
            )
            time.sleep(2)  # Additional wait for dynamic content
        except Exception as e:
            print(f"Page load timeout: {e}")
    
    def setup_document_styles(self):
        """Setup document styles"""
        # Title style
        title_style = self.doc.styles.add_style('CustomTitle', WD_STYLE_TYPE.PARAGRAPH)
        title_font = title_style.font
        title_font.name = 'Arial'
        title_font.size = Pt(24)
        title_font.bold = True
        title_style.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        title_style.paragraph_format.space_after = Pt(12)
        
        # Heading styles
        heading1_style = self.doc.styles.add_style('CustomHeading1', WD_STYLE_TYPE.PARAGRAPH)
        heading1_font = heading1_style.font
        heading1_font.name = 'Arial'
        heading1_font.size = Pt(18)
        heading1_font.bold = True
        heading1_style.paragraph_format.space_before = Pt(12)
        heading1_style.paragraph_format.space_after = Pt(6)
        
        heading2_style = self.doc.styles.add_style('CustomHeading2', WD_STYLE_TYPE.PARAGRAPH)
        heading2_font = heading2_style.font
        heading2_font.name = 'Arial'
        heading2_font.size = Pt(14)
        heading2_font.bold = True
        heading2_style.paragraph_format.space_before = Pt(6)
        heading2_style.paragraph_format.space_after = Pt(3)
    
    def add_cover_page(self):
        """Add cover page to the document"""
        # Title
        title = self.doc.add_paragraph("USER MANUAL", style='CustomTitle')
        title.alignment = WD_ALIGN_PARAGRAPH.CENTER
        
        # Subtitle
        subtitle = self.doc.add_paragraph("Computerized Stationary Management System", style='CustomTitle')
        subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
        
        # Organization
        org = self.doc.add_paragraph("Pakistan State Oil (PSO)", style='CustomHeading1')
        org.alignment = WD_ALIGN_PARAGRAPH.CENTER
        
        # Add some space
        self.doc.add_paragraph("")
        self.doc.add_paragraph("")
        
        # Version info
        version_info = self.doc.add_paragraph(f"Generated on: {datetime.now().strftime('%B %d, %Y')}")
        version_info.alignment = WD_ALIGN_PARAGRAPH.CENTER
        
        # Page break
        self.doc.add_page_break()
    
    def add_table_of_contents(self):
        """Add table of contents"""
        toc_heading = self.doc.add_paragraph("TABLE OF CONTENTS", style='CustomHeading1')
        toc_heading.alignment = WD_ALIGN_PARAGRAPH.CENTER
        
        toc_items = [
            "1. Introduction",
            "2. Getting Started",
            "3. Authentication System",
            "4. Dashboard Overview",
            "5. Inventory Management",
            "6. Email Management",
            "7. User Profile Management",
            "8. Troubleshooting",
            "9. Appendix"
        ]
        
        for item in toc_items:
            self.doc.add_paragraph(item, style='Normal')
        
        self.doc.add_page_break()
    
    def add_section(self, title, content, screenshot_path=None):
        """Add a section with title, content, and optional screenshot"""
        # Add heading
        self.doc.add_paragraph(title, style='CustomHeading1')
        
        # Add content
        if isinstance(content, list):
            for paragraph in content:
                self.doc.add_paragraph(paragraph, style='Normal')
        else:
            self.doc.add_paragraph(content, style='Normal')
        
        # Add screenshot if provided
        if screenshot_path and os.path.exists(screenshot_path):
            try:
                self.doc.add_paragraph("Screenshot:", style='CustomHeading2')
                self.doc.add_picture(str(screenshot_path), width=Inches(6))
                self.doc.add_paragraph("")  # Add space after image
            except Exception as e:
                print(f"Error adding screenshot {screenshot_path}: {e}")
    
    def login_to_system(self):
        """Login to the system for authenticated pages"""
        try:
            print("Navigating to login page...")
            self.driver.get(self.base_url)
            self.wait_for_page_load()
            
            # Take screenshot of login page
            login_screenshot = self.take_screenshot("01_login_page")
            
            # Find and fill email field
            email_field = self.wait_for_element(By.CSS_SELECTOR, "input[type='email'], input[name='email']")
            if email_field:
                email_field.clear()
                email_field.send_keys(self.test_email)
            
            # Find and fill password field
            password_field = self.wait_for_element(By.CSS_SELECTOR, "input[type='password'], input[name='password']")
            if password_field:
                password_field.clear()
                password_field.send_keys(self.test_password)
            
            # Find and click login button
            login_button = self.wait_for_element(By.CSS_SELECTOR, "button[type='submit'], button:contains('Sign In')")
            if login_button:
                login_button.click()
                self.wait_for_page_load()
                print("Login successful")
                return True
            else:
                print("Login button not found")
                return False
                
        except Exception as e:
            print(f"Login failed: {e}")
            return False
    
    def capture_landing_page(self):
        """Capture the landing page"""
        print("Capturing landing page...")
        self.driver.get(self.base_url)
        self.wait_for_page_load()
        
        screenshot_path = self.take_screenshot("00_landing_page")
        
        content = [
            "The Computerized Stationary Management System is a comprehensive web-based application designed for Pakistan State Oil (PSO) to manage inventory operations efficiently.",
            "",
            "Key Features:",
            "• Real-time Analytics & Reporting",
            "• Role-based Access Control", 
            "• Secure Data Management",
            "• Email Notifications",
            "• Stock History Tracking",
            "",
            "The landing page provides access to both login and signup functionality through a tabbed interface."
        ]
        
        self.add_section("1. Introduction - Landing Page", content, screenshot_path)
    
    def capture_authentication(self):
        """Capture authentication pages"""
        print("Capturing authentication pages...")
        
        # Login tab
        self.driver.get(self.base_url)
        self.wait_for_page_load()
        
        # Click on login tab if not already active
        try:
            login_tab = self.driver.find_element(By.XPATH, "//button[contains(text(), 'Sign In')]")
            login_tab.click()
            time.sleep(1)
        except:
            pass
        
        login_screenshot = self.take_screenshot("02_login_form")
        
        # Signup tab
        try:
            signup_tab = self.driver.find_element(By.XPATH, "//button[contains(text(), 'Sign Up')]")
            signup_tab.click()
            time.sleep(1)
            signup_screenshot = self.take_screenshot("03_signup_form")
        except:
            signup_screenshot = None
        
        content = [
            "The authentication system provides secure access to the inventory management system.",
            "",
            "Login Process:",
            "1. Enter your registered email address",
            "2. Enter your password",
            "3. Click 'Sign In' to access the dashboard",
            "",
            "Sign Up Process:",
            "1. Enter your full name",
            "2. Provide a valid email address",
            "3. Create a secure password",
            "4. Click 'Sign Up' to create your account",
            "",
            "The system includes form validation and error handling for security."
        ]
        
        self.add_section("2. Authentication System", content, login_screenshot)
        
        if signup_screenshot:
            self.add_section("2.1 User Registration", ["New users can register using the Sign Up tab."], signup_screenshot)
    
    def capture_dashboard(self):
        """Capture dashboard page"""
        print("Capturing dashboard...")
        
        # Login first
        if not self.login_to_system():
            print("Cannot access dashboard - login failed")
            return
        
        # Navigate to dashboard
        self.driver.get(f"{self.base_url}/dashboard")
        self.wait_for_page_load()
        
        dashboard_screenshot = self.take_screenshot("04_dashboard")
        
        content = [
            "The dashboard provides a comprehensive overview of your inventory system.",
            "",
            "Dashboard Features:",
            "• Real-time statistics and metrics",
            "• Interactive charts and graphs",
            "• Quick access navigation menu",
            "• User profile information",
            "",
            "Navigation Menu:",
            "• Dashboard - Overview and analytics",
            "• Inventory - Stock management and history",
            "• Email Management - Communication tools",
            "",
            "The header displays the PSO logo, system name, and user information with logout functionality."
        ]
        
        self.add_section("3. Dashboard Overview", content, dashboard_screenshot)
    
    def capture_inventory_management(self):
        """Capture inventory management pages"""
        print("Capturing inventory management...")
        
        # Navigate to inventory page
        self.driver.get(f"{self.base_url}/inventory")
        self.wait_for_page_load()
        
        # Capture main inventory page
        inventory_screenshot = self.take_screenshot("05_inventory_overview")
        
        content = [
            "The Inventory Management section is the core of the system, providing comprehensive tools for managing stock items.",
            "",
            "The inventory section contains three main tabs:",
            "1. Inventory Overview - Combined view of all inventory data",
            "2. Current Stock - Real-time stock levels and item details",
            "3. Stock History - Historical transactions and movements",
            "",
            "Features available in inventory management:",
            "• Add new inventory items",
            "• Update stock quantities",
            "• Track stock movements",
            "• Generate reports",
            "• Search and filter items"
        ]
        
        self.add_section("4. Inventory Management", content, inventory_screenshot)
        
        # Capture Current Stock tab
        try:
            current_stock_tab = self.driver.find_element(By.XPATH, "//button[contains(text(), 'Current Stock')]")
            current_stock_tab.click()
            time.sleep(2)
            current_stock_screenshot = self.take_screenshot("06_current_stock")
            
            current_stock_content = [
                "The Current Stock tab displays real-time inventory levels.",
                "",
                "Features:",
                "• View all items with current quantities",
                "• Add new inventory items",
                "• Update existing item details",
                "• Delete items when necessary",
                "• Search and filter functionality",
                "",
                "Each item displays:",
                "• Item name and description",
                "• Current quantity in stock",
                "• Location information",
                "• Last updated timestamp"
            ]
            
            self.add_section("4.1 Current Stock Management", current_stock_content, current_stock_screenshot)
        except Exception as e:
            print(f"Error capturing current stock tab: {e}")
        
        # Capture Stock History tab
        try:
            history_tab = self.driver.find_element(By.XPATH, "//button[contains(text(), 'Stock History')]")
            history_tab.click()
            time.sleep(2)
            history_screenshot = self.take_screenshot("07_stock_history")
            
            history_content = [
                "The Stock History tab provides a complete audit trail of all inventory movements.",
                "",
                "Features:",
                "• View all stock transactions",
                "• Filter by date range",
                "• Filter by transaction type (IN/OUT)",
                "• Search by item or user",
                "• Export history reports",
                "",
                "Transaction details include:",
                "• Date and time of transaction",
                "• Item name and description",
                "• Quantity changed",
                "• Transaction type (Stock In/Stock Out)",
                "• User who performed the action",
                "• Additional notes or comments"
            ]
            
            self.add_section("4.2 Stock History Tracking", history_content, history_screenshot)
        except Exception as e:
            print(f"Error capturing stock history tab: {e}")
        
        # Capture Add Item page
        try:
            self.driver.get(f"{self.base_url}/inventory/add")
            self.wait_for_page_load()
            add_item_screenshot = self.take_screenshot("08_add_item")
            
            add_item_content = [
                "The Add Item page allows users to add new inventory items to the system.",
                "",
                "Required Information:",
                "• Item Name - Descriptive name of the item",
                "• Description - Detailed description",
                "• Quantity - Initial stock quantity",
                "• Location - Storage location",
                "• Category - Item classification",
                "",
                "Process:",
                "1. Fill in all required fields",
                "2. Verify information accuracy",
                "3. Click 'Add Item' to save",
                "4. System will confirm successful addition"
            ]
            
            self.add_section("4.3 Adding New Items", add_item_content, add_item_screenshot)
        except Exception as e:
            print(f"Error capturing add item page: {e}")
    
    def capture_email_management(self):
        """Capture email management page"""
        print("Capturing email management...")
        
        try:
            self.driver.get(f"{self.base_url}/email-management")
            self.wait_for_page_load()
            
            email_screenshot = self.take_screenshot("09_email_management")
            
            content = [
                "The Email Management system provides automated communication capabilities.",
                "",
                "Features:",
                "• Send automated inventory reports",
                "• Configure email templates",
                "• Manage recipient lists",
                "• Schedule regular reports",
                "• Test email configuration",
                "",
                "Email Types:",
                "• Low stock alerts",
                "• Daily/Weekly inventory reports",
                "• Stock movement notifications",
                "• System maintenance alerts",
                "",
                "Configuration Options:",
                "• SMTP server settings",
                "• Email templates customization",
                "• Recipient management",
                "• Scheduling preferences"
            ]
            
            self.add_section("5. Email Management", content, email_screenshot)
        except Exception as e:
            print(f"Error capturing email management: {e}")
    
    def add_troubleshooting_section(self):
        """Add troubleshooting section"""
        content = [
            "Common Issues and Solutions:",
            "",
            "Login Problems:",
            "• Verify email and password are correct",
            "• Check internet connection",
            "• Clear browser cache and cookies",
            "• Contact system administrator if issues persist",
            "",
            "Performance Issues:",
            "• Refresh the page",
            "• Check internet connection speed",
            "• Close unnecessary browser tabs",
            "• Use supported browsers (Chrome, Firefox, Safari)",
            "",
            "Data Not Loading:",
            "• Wait for page to fully load",
            "• Refresh the page",
            "• Check if you have proper permissions",
            "• Contact support if data appears missing",
            "",
            "Email Issues:",
            "• Verify email configuration",
            "• Check spam/junk folders",
            "• Ensure recipient email addresses are correct",
            "• Test email configuration in Email Management",
            "",
            "Browser Compatibility:",
            "• Use modern browsers (Chrome 90+, Firefox 88+, Safari 14+)",
            "• Enable JavaScript",
            "• Allow cookies for the application domain"
        ]
        
        self.add_section("6. Troubleshooting", content)
    
    def add_text_only_sections(self):
        """Add content sections without screenshots"""
        # 1. Introduction
        intro_content = [
            "The Computerized Stationary Management System is a comprehensive web-based application designed for Pakistan State Oil (PSO) to manage inventory operations efficiently.",
            "",
            "Key Features:",
            "• Real-time inventory tracking and management",
            "• User authentication and role-based access control",
            "• Comprehensive dashboard with analytics",
            "• Stock history and audit trail",
            "• Email notifications and reporting",
            "• Modern, responsive web interface"
        ]
        self.add_section("1. Introduction", intro_content)
        
        # 2. Getting Started
        getting_started_content = [
            "System Access:",
            "1. Open your web browser",
            "2. Navigate to the application URL",
            "3. Use your provided credentials to login",
            "",
            "First Time Users:",
            "• Contact your administrator for account setup",
            "• Ensure you have the correct permissions",
            "• Familiarize yourself with the interface"
        ]
        self.add_section("2. Getting Started", getting_started_content)
        
        # 3. Authentication
        auth_content = [
            "Login Process:",
            "1. Enter your email address",
            "2. Enter your password",
            "3. Click 'Sign In' to access the system",
            "",
            "New User Registration:",
            "1. Click 'Sign Up' tab",
            "2. Fill in your details (name, email, password)",
            "3. Submit the form to create your account",
            "",
            "Security Features:",
            "• Secure session management",
            "• Automatic logout after inactivity",
            "• Password protection"
        ]
        self.add_section("3. Authentication System", auth_content)
        
        # 4. Dashboard
        dashboard_content = [
            "The dashboard provides an overview of your inventory system with:",
            "",
            "Navigation Menu:",
            "• Dashboard - Main overview and statistics",
            "• Inventory - Stock management and history",
            "• Email Management - Communication tools",
            "",
            "Key Information Displayed:",
            "• Current stock levels",
            "• Recent activity",
            "• System statistics",
            "• Quick action buttons"
        ]
        self.add_section("4. Dashboard Overview", dashboard_content)
        
        # 5. Inventory Management
        inventory_content = [
            "The inventory section includes three main tabs:",
            "",
            "Inventory Overview:",
            "• Combined view of all inventory items",
            "• Real-time stock levels",
            "• Quick search and filtering",
            "",
            "Current Stock:",
            "• Add new inventory items",
            "• Update existing stock levels",
            "• Manage item details",
            "",
            "Stock History:",
            "• Complete audit trail of all transactions",
            "• Filter by date, item, or transaction type",
            "• Export capabilities for reporting"
        ]
        self.add_section("5. Inventory Management", inventory_content)
        
        # 6. Email Management
        email_content = [
            "Email management features include:",
            "",
            "Automated Notifications:",
            "• Low stock alerts",
            "• System notifications",
            "• Custom email templates",
            "",
            "Configuration Options:",
            "• SMTP settings",
            "• Recipient management",
            "• Email scheduling",
            "",
            "Testing and Monitoring:",
            "• Send test emails",
            "• Monitor delivery status",
            "• Troubleshoot email issues"
        ]
        self.add_section("6. Email Management", email_content)

    def add_appendix(self):
        """Add appendix with additional information"""
        content = [
            "System Requirements:",
            "",
            "Minimum Browser Requirements:",
            "• Google Chrome 90 or later",
            "• Mozilla Firefox 88 or later",
            "• Safari 14 or later",
            "• Microsoft Edge 90 or later",
            "",
            "Network Requirements:",
            "• Stable internet connection",
            "• Minimum 1 Mbps download speed",
            "• JavaScript enabled",
            "• Cookies enabled",
            "",
            "Security Features:",
            "• Secure HTTPS connection",
            "• Session-based authentication",
            "• Role-based access control",
            "• Data encryption in transit",
            "",
            "Support Information:",
            "• For technical support, contact your system administrator",
            "• Keep your login credentials secure",
            "• Report any security concerns immediately",
            "• Regular system backups are performed automatically"
        ]
        
        self.add_section("7. Appendix", content)
    
    def generate_manual(self, include_screenshots=True):
        """Generate the complete user manual with optional screenshots"""
        print("Starting user manual generation...")
        
        try:
            # Setup
            if include_screenshots:
                self.setup_driver()
            self.setup_document_styles()
            
            # Add document sections
            self.add_cover_page()
            self.add_table_of_contents()
            
            if include_screenshots:
                # Capture application pages
                self.capture_landing_page()
                self.capture_authentication()
                self.capture_dashboard()
                self.capture_inventory_management()
                self.capture_email_management()
            else:
                # Add content without screenshots
                self.add_text_only_sections()
            
            # Add additional sections
            self.add_troubleshooting_section()
            self.add_appendix()
            
            # Save document
            doc_path = "User_Manual.docx"
            self.doc.save(doc_path)
            print(f"User manual saved as: {doc_path}")
            return doc_path
            
        except Exception as e:
            print(f"Error generating manual: {e}")
            return None
        finally:
            if include_screenshots and self.driver:
                self.driver.quit()
                print("Browser closed")

def main():
    """Main function to run the user manual generator"""
    print("=== Inventory Management System - User Manual Generator ===")
    print("Checking if development server is running...")
    
    # Check if server is running
    import requests
    server_running = False
    try:
        response = requests.get("http://localhost:3000", timeout=5)
        if response.status_code == 200:
            server_running = True
            print("✓ Development server is running")
        else:
            print(f"⚠️ Development server responded with status: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Cannot connect to development server: {e}")
    
    if not server_running:
        print("\n⚠️ Development server is not accessible.")
        print("The manual will be generated without screenshots.")
        print("To include screenshots, please:")
        print("1. Start the development server: npm run dev")
        print("2. Ensure it's running on http://localhost:3000")
        print("3. Run this script again")
        print("\nProceeding with text-only manual generation...")
    
    print("Generating user manual...")
    print()
    
    generator = UserManualGenerator()
    doc_path = generator.generate_manual(include_screenshots=server_running)
    
    print("\n=== Manual Generation Complete ===")
    print(f"✓ User manual created: {doc_path}")
    if server_running:
        print("✓ Screenshots captured and embedded")
    else:
        print("⚠️ Screenshots skipped (server not accessible)")
    print("✓ Professional formatting applied")
    print("\nThe manual is ready for use and distribution.")

if __name__ == "__main__":
    main()