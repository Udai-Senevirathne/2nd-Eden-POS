// Browser utility functions for detecting capabilities and issues

export class BrowserUtils {
  
  // Detect if popups are blocked
  static detectPopupBlocker(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const testWindow = window.open('', '_blank', 'width=1,height=1');
        
        if (!testWindow || testWindow.closed || typeof testWindow.closed === 'undefined') {
          resolve(true); // Popup is blocked
        } else {
          testWindow.close();
          resolve(false); // Popup is allowed
        }
      } catch {
        resolve(true); // Error means popup is likely blocked
      }
    });
  }
  
  // Get browser information
  static getBrowserInfo() {
    const userAgent = navigator.userAgent;
    let browserName = 'Unknown';
    let browserVersion = 'Unknown';
    
    if (userAgent.includes('Chrome')) {
      browserName = 'Chrome';
      const match = userAgent.match(/Chrome\/([0-9.]+)/);
      browserVersion = match ? match[1] : 'Unknown';
    } else if (userAgent.includes('Firefox')) {
      browserName = 'Firefox';
      const match = userAgent.match(/Firefox\/([0-9.]+)/);
      browserVersion = match ? match[1] : 'Unknown';
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      browserName = 'Safari';
      const match = userAgent.match(/Version\/([0-9.]+)/);
      browserVersion = match ? match[1] : 'Unknown';
    } else if (userAgent.includes('Edge')) {
      browserName = 'Edge';
      const match = userAgent.match(/Edge\/([0-9.]+)/);
      browserVersion = match ? match[1] : 'Unknown';
    }
    
    return { browserName, browserVersion };
  }
  
  // Check printing capabilities
  static checkPrintingSupport() {
    return {
      hasPrintFunction: typeof window.print === 'function',
      hasWindowOpen: typeof window.open === 'function',
      supportsPopups: !window.navigator.userAgent.includes('Mobile'), // Basic mobile check
    };
  }
  
  // Get instructions for enabling popups based on browser
  static getPopupInstructions() {
    const { browserName } = this.getBrowserInfo();
    
    const instructions: Record<string, string> = {
      'Chrome': `
        1. Click the popup blocked icon (🚫) in the address bar
        2. Select "Always allow popups from this site"
        3. Click "Done" and try printing again
      `,
      'Firefox': `
        1. Click the shield icon in the address bar
        2. Select "Disable Blocking for This Site"
        3. Refresh the page and try printing again
      `,
      'Safari': `
        1. Go to Safari > Preferences > Websites
        2. Click "Pop-up Windows" in the sidebar
        3. Set this site to "Allow"
        4. Try printing again
      `,
      'Edge': `
        1. Click the popup blocked icon in the address bar
        2. Select "Always allow"
        3. Try printing again
      `,
      'Unknown': `
        Please check your browser's popup blocker settings and allow popups for this site.
      `
    };
    
    return instructions[browserName] || instructions['Unknown'];
  }
  
  // Test if local storage is available
  static testLocalStorage(): boolean {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }
  
  // Test if session storage is available
  static testSessionStorage(): boolean {
    try {
      const test = '__sessionStorage_test__';
      sessionStorage.setItem(test, test);
      sessionStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }
  
  // Get comprehensive browser compatibility report
  static getCompatibilityReport() {
    const browserInfo = this.getBrowserInfo();
    const printingSupport = this.checkPrintingSupport();
    
    return {
      browser: browserInfo,
      printing: printingSupport,
      storage: {
        localStorage: this.testLocalStorage(),
        sessionStorage: this.testSessionStorage(),
      },
      popupInstructions: this.getPopupInstructions(),
      isModernBrowser: this.isModernBrowser(),
    };
  }
  
  // Check if browser supports modern features needed for POS
  static isModernBrowser(): boolean {
    return !!(
      typeof window.fetch === 'function' &&
      window.Promise &&
      window.URLSearchParams &&
      typeof window.addEventListener === 'function' &&
      'includes' in Array.prototype &&
      Object.assign
    );
  }
  
  // Show browser compatibility warning if needed
  static showCompatibilityWarning(): string | null {
    if (!this.isModernBrowser()) {
      return 'Your browser may not support all features of this POS system. Please update to a modern browser for the best experience.';
    }
    
    const { browserName, browserVersion } = this.getBrowserInfo();
    
    // Check for very old versions
    if (browserName === 'Chrome' && parseFloat(browserVersion) < 80) {
      return 'Your Chrome browser is outdated. Please update for optimal printing and POS functionality.';
    }
    
    if (browserName === 'Firefox' && parseFloat(browserVersion) < 75) {
      return 'Your Firefox browser is outdated. Please update for optimal printing and POS functionality.';
    }
    
    if (browserName === 'Safari' && parseFloat(browserVersion) < 13) {
      return 'Your Safari browser may have limited compatibility. Consider using Chrome or Firefox for the best experience.';
    }
    
    return null;
  }
}

export default BrowserUtils;