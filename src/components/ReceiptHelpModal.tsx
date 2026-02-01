import React, { useState, useEffect } from 'react';
import BrowserUtils from '../utils/browserUtils';

interface ReceiptHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetryPrint?: () => void;
}

export const ReceiptHelpModal: React.FC<ReceiptHelpModalProps> = ({ 
  isOpen, 
  onClose, 
  onRetryPrint 
}) => {
  const [browserInfo, setBrowserInfo] = useState<{
    browser: { browserName: string; browserVersion: string };
    popupInstructions: string;
    isModernBrowser: boolean;
  } | null>(null);
  const [isPopupBlocked, setIsPopupBlocked] = useState<boolean | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Get browser compatibility info
      const compatibility = BrowserUtils.getCompatibilityReport();
      setBrowserInfo({
        browser: compatibility.browser,
        popupInstructions: compatibility.popupInstructions,
        isModernBrowser: compatibility.isModernBrowser,
      });

      // Test popup blocker
      BrowserUtils.detectPopupBlocker().then(setIsPopupBlocked);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">🖨️ Receipt Printing Help</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Browser Detection */}
          {browserInfo && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Your Browser Information</h3>
              <div className="bg-gray-100 p-3 rounded-lg">
                <p><strong>Browser:</strong> {browserInfo.browser.browserName} {browserInfo.browser.browserVersion}</p>
                <p><strong>Modern Features:</strong> {browserInfo.isModernBrowser ? '✅ Supported' : '❌ Limited'}</p>
                <p><strong>Popup Status:</strong> {
                  isPopupBlocked === null ? '🔍 Checking...' : 
                  isPopupBlocked ? '🚫 Blocked' : '✅ Allowed'
                }</p>
              </div>
            </div>
          )}

          {/* Common Issues and Solutions */}
          <div className="space-y-4">
            <div className="border-l-4 border-red-500 pl-4">
              <h3 className="text-lg font-semibold text-red-700 mb-2">🚫 Popup Blocker Issues</h3>
              <p className="text-gray-700 mb-2">
                Most receipt printing problems are caused by popup blockers preventing the receipt window from opening.
              </p>
              {browserInfo && (
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <p className="font-medium text-yellow-800 mb-2">Instructions for {browserInfo.browser.browserName}:</p>
                  <div className="text-sm text-yellow-700 whitespace-pre-line">
                    {browserInfo.popupInstructions}
                  </div>
                </div>
              )}
            </div>

            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="text-lg font-semibold text-blue-700 mb-2">🖨️ Print Settings</h3>
              <ul className="text-gray-700 space-y-1 text-sm">
                <li>• Make sure you have a printer connected or use "Save as PDF"</li>
                <li>• Check that your default printer is set correctly</li>
                <li>• For thermal printers, ensure they are powered on and have paper</li>
                <li>• Try printing a test page from your browser settings</li>
              </ul>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="text-lg font-semibold text-green-700 mb-2">✅ Alternative Solutions</h3>
              <ul className="text-gray-700 space-y-1 text-sm">
                <li>• Use the "Preview Receipt" option first to see the receipt</li>
                <li>• Copy receipt details and print from a word processor</li>
                <li>• Email the receipt to yourself for printing later</li>
                <li>• Use the order confirmation screen to reprint receipts</li>
              </ul>
            </div>

            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="text-lg font-semibold text-purple-700 mb-2">🔧 Quick Fixes</h3>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    BrowserUtils.detectPopupBlocker().then(blocked => {
                      setIsPopupBlocked(blocked);
                      if (!blocked) {
                        alert('✅ Popup test successful! Try printing again.');
                      } else {
                        alert('❌ Popups are still blocked. Please follow the instructions above.');
                      }
                    });
                  }}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 mr-2"
                >
                  🔍 Test Popup Blocker
                </button>
                <button
                  onClick={() => {
                    window.open('data:text/html,<h1>Test Print Page</h1><p>If you can see and print this page, your browser printing works correctly.</p><script>setTimeout(() => window.print(), 1000);</script>', '_blank');
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 mr-2"
                >
                  🖨️ Test Print Function
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Close
            </button>
            {onRetryPrint && (
              <button
                onClick={() => {
                  onRetryPrint();
                  onClose();
                }}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
              >
                🔄 Try Printing Again
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptHelpModal;