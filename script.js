// Configuration
const API_BASE = 'https://dashboard.imash.io/api/v2';

// State management
let currentPage = '/';
let currentApiResource = 'crm_leads';
let currentOperation = 'select';
let theme = localStorage.getItem('theme') || 'dark';
let apiInfoConfig = {};
let systemTableConfig = {};

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', async () => {
  // Apply saved theme
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  }

  // Load meta configuration first
  await loadMetaConfig();

  // Load configurations
  await loadConfigurations();

  // Initialize routing
  initRouter();
  
  // Initialize API sidebar
  initApiSidebar();
  
  // Setup event listeners
  setupEventListeners();
  
  // Initialize mobile menu
  initMobileMenu();
  
  // Update origin placeholders
  updateOriginPlaceholders();
  
  // Navigate to initial route
  let initialRoute = window.location.pathname || '/';
  console.log('Initial route on page load:', initialRoute);
  
  // Force to root if loading docs root
  if (initialRoute === '/docs' || initialRoute === '/docs/' || initialRoute === '') {
    initialRoute = '/';
  }
  
  // Check if there's pre-rendered content for this route
  const dynamicContent = document.getElementById('dynamic-content');
  const hasPreRenderedContent = dynamicContent && 
                                 dynamicContent.getAttribute('data-route') === initialRoute && 
                                 dynamicContent.innerHTML.trim() !== '';
  
  // Force show on initial page load
  navigateTo(initialRoute, true);
  
  // Ensure TOC is updated after navigation completes
  // This handles both pre-rendered and dynamically loaded content
  setTimeout(() => {
    updateTOC();
  }, 150);
  
  // If navigating directly to API reference, ensure resource is selected
  if (initialRoute === '/api-reference' && Object.keys(apiInfoConfig).length > 0) {
    const firstResource = Object.keys(apiInfoConfig)[0];
    selectApiResource(firstResource);
  }
});

// Load configurations dynamically
async function loadConfigurations() {
  try {
    // Try to fetch configurations from API endpoints (works when deployed)
    const [apiInfoResponse, systemTableResponse] = await Promise.all([
      fetch('/apiInfoConfig.json').catch(() => fetch('/api/config/apiInfoConfig')),
      fetch('https://docs.imash.io/api/config/systemTableConfig')
    ]);
    
    if (apiInfoResponse.ok) {
      apiInfoConfig = await apiInfoResponse.json();
      console.log('Loaded apiInfoConfig');
    } else {
      console.error('Failed to load apiInfoConfig');
      // Initialize with empty object to prevent errors
      apiInfoConfig = {};
    }
    
    if (systemTableResponse.ok) {
      systemTableConfig = await systemTableResponse.json();
      console.log('Loaded systemTableConfig');
    } else {
      console.error('Failed to load systemTableConfig');
      // Initialize with empty object to prevent errors
      systemTableConfig = {};
    }
    
    // If both configs are empty, show appropriate message
    if (Object.keys(apiInfoConfig).length === 0 && Object.keys(systemTableConfig).length === 0) {
      console.log('API configurations not available - this is normal when running locally');
      // Show info message in UI
      const sidebar = document.querySelector('.apiref-sidebar');
      if (sidebar) {
        sidebar.innerHTML = '<div style="padding: 1rem; color: #888;">API configurations are only available when deployed. Local documentation browsing is still available.</div>';
      }
    }
    
  } catch (error) {
    console.error('Error loading configurations:', error);
    // Initialize with empty objects to prevent errors
    apiInfoConfig = {};
    systemTableConfig = {};
    
    // Show info message in UI for local usage
    const sidebar = document.querySelector('.apiref-sidebar');
    if (sidebar) {
      sidebar.innerHTML = '<div style="padding: 1rem; color: #888;">Running in local mode. API reference requires server deployment.</div>';
    }
  }
}

// Get table names mapping
function getTableNameMapping() {
  const mapping = {
    crm_leads: 'crm_leads',
    crm_contacts: 'crm_contacts',
    crm_accounts: 'crm_accounts',
    campaigns: 'campaigns',
    callLogs: 'callLogs',
    assistants: 'assistants',
    phoneNumbers: 'phoneNumbers',
    phoneProviders: 'phoneProviders',
    customTools: 'customTools',
    doNotCall: 'do_not_call',
    internalUsers: 'internalUsers',
    calendar_events: 'calendar_events',
    calendar_categories: 'calendar_categories',
    calendar_event_participants: 'calendar_event_participants',
    crm_settings: 'crm_settings'
  };
  
  // Create reverse mapping for apiInfoConfig keys
  const reverseMapping = {};
  Object.keys(apiInfoConfig).forEach(key => {
    const tableName = apiInfoConfig[key]?.tableName;
    if (tableName) {
      reverseMapping[tableName] = key;
    }
  });
  
  return { mapping, reverseMapping };
}

// Router
function initRouter() {
  window.addEventListener('popstate', (e) => {
    if (e.state && e.state.route) {
      showPage(e.state.route);
    }
  });
}

function navigateTo(route, forceShow = false) {
  if (!forceShow && route === currentPage) return;
  
  currentPage = route;
  
  // Only use pushState when not running in file:// protocol (local mode)
  if (window.location.protocol !== 'file:') {
    window.history.pushState({ route }, '', route);
  }
  
  showPage(route);
}

function showPage(route) {
  console.log('showPage called with route:', route);
  
  // Update meta tags for the new route
  updateMetaForRoute(route);
  
  // Special handling for root route - show introduction
  if (route === '/' || route === '') {
    const introPage = document.getElementById('page-introduction');
    const dynamicContent = document.getElementById('dynamic-content');
    
    // Hide all pages first
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    // Clear and hide dynamic content if it exists
    if (dynamicContent) {
      dynamicContent.innerHTML = '';
      dynamicContent.style.display = 'none';
      dynamicContent.classList.remove('active');
    }
    
    // Show introduction page
    if (introPage) {
      console.log('Showing introduction page');
      introPage.classList.add('active');
      updateNavigation(route);
      updateSidebarForTab(route);
      updateTOC();
      window.scrollTo(0, 0);
      return; // Exit after handling introduction
    }
  }
  
  // Hide all pages (but we'll re-add active to the correct one)
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  
  // Only clear dynamic content when navigating TO API reference pages
  // For documentation pages, preserve any pre-rendered content
  const dynamicContent = document.getElementById('dynamic-content');
  
  // Check if this is an API reference route
  if (route.startsWith('/api-reference')) {
    // Clear dynamic content for API pages
    if (dynamicContent) {
      dynamicContent.innerHTML = '';
      dynamicContent.style.display = 'none';
      dynamicContent.classList.remove('active');
    }
    
    // Show the API reference page
    const page = document.querySelector('[data-route="/api-reference"]');
    if (page) {
      page.classList.add('active');
      
      // Update navigation for API reference
      updateNavigation('/api-reference');
      
      // Update sidebar for API reference
      updateSidebarForTab('/api-reference');
      
      // Check if there's a specific resource in the URL
      const tableName = route.split('/api-reference/')[1];
      if (tableName && Object.keys(apiInfoConfig).length > 0) {
        // Find the resource key for this table name
        let resourceKey = null;
        for (const [key, config] of Object.entries(apiInfoConfig)) {
          if (config.tableName === tableName) {
            resourceKey = key;
            break;
          }
        }
        
        // Select the specific resource if found
        if (resourceKey) {
          setTimeout(() => {
            selectApiResource(resourceKey);
          }, 100);
        }
      } else if (Object.keys(apiInfoConfig).length > 0) {
        // No specific resource, select the first one
        setTimeout(() => {
          const firstResource = Object.keys(apiInfoConfig)[0];
          selectApiResource(firstResource);
        }, 100);
      }
      
      // Update TOC
      updateTOC();
      
      // Scroll to top
      window.scrollTo(0, 0);
    }
    return;
  }
  
  // Find and show matching page
  let page = document.querySelector(`[data-route="${route}"]`);
  console.log('Looking for page with data-route:', route, 'Found:', page);
  
  if (!page) {
    // Try alternate route
    page = document.querySelector(`[data-alt*="${route}"]`);
    console.log('Trying alternate route, found:', page);
  }
  
  // If page not found and it's a documentation route
  if (!page && (route.startsWith('/get-started/') || 
                route.startsWith('/agents/') || 
                route.startsWith('/phone-system/') ||
                route.startsWith('/phone/') ||
                route.startsWith('/campaigns/') ||
                route.startsWith('/crm/') ||
                route.startsWith('/automations/') ||
                route.startsWith('/analytics/') ||
                route.startsWith('/settings/'))) {
    // Use dynamic content section
    page = document.getElementById('dynamic-content');
    
    // Check if there's already pre-rendered content for this route
    if (page && page.getAttribute('data-route') === route && page.innerHTML.trim() !== '') {
      // Pre-rendered content exists, just show it
      page.style.display = 'block';
      page.classList.add('active');
      updateNavigation(route);
      updateSidebarForTab(route);
      // Add a small delay to ensure DOM is ready for TOC
      setTimeout(() => {
        updateTOC();
      }, 50);
      window.scrollTo(0, 0);
      return;
    } else if (page && window.loadDynamicContent) {
      // No pre-rendered content, load dynamically
      window.loadDynamicContent(route).then(() => {
        page.style.display = 'block';
        page.classList.add('active');
        updateNavigation(route);
        updateSidebarForTab(route);
        updateTOC();
        window.scrollTo(0, 0);
      });
      return;
    }
  }
  
  if (!page) {
    // Default to introduction
    page = document.querySelector('[data-route="/"]');
  }
  
  if (page) {
    console.log('Adding active class to page:', page);
    page.classList.add('active');
    
    // Update navigation
    updateNavigation(route);
    
    // Update sidebar based on tab
    updateSidebarForTab(route);
    
    // Update TOC
    updateTOC();
    
    // Scroll to top
    window.scrollTo(0, 0);
  } else {
    console.log('No page found for route:', route);
  }
}

// Update sidebar based on active tab
function updateSidebarForTab(route) {
  const sidebar = document.getElementById('sidebar');
  const toc = document.getElementById('toc');
  
  // Check if we're in mobile view
  const isMobile = window.innerWidth <= 1200;
  
  // Hide/show sidebar and TOC based on tab
  if (route === '/api-reference') {
    // API Reference tab - hide regular sidebar and TOC
    if (sidebar) {
      if (!isMobile) {
        sidebar.style.display = 'none';
      }
      // On mobile, let CSS handle it - don't override
    }
    if (toc) {
      if (!isMobile) {
        toc.style.display = 'none';
      }
      // On mobile, let CSS handle it - don't override
    }
    
    // Auto-select first API resource if none selected
    setTimeout(() => {
      if (Object.keys(apiInfoConfig).length > 0) {
        const firstResource = Object.keys(apiInfoConfig)[0];
        selectApiResource(firstResource);
      }
    }, 100);
  } else if (route === '/videos') {
    // Videos tab - show video sidebar, hide TOC
    if (sidebar) {
      if (!isMobile) {
        sidebar.style.display = 'block';
      }
      // On mobile, sidebar is hidden by CSS - don't override
      
      sidebar.innerHTML = `
      <div class="sidebar-inner">
        <div class="sidebar-group">
          <div class="sidebar-group-title">Video Tutorials</div>
          <ul>
            <li><a href="#" class="nav-link">Getting Started</a></li>
            <li><a href="#" class="nav-link">Building Agents</a></li>
            <li><a href="#" class="nav-link">API Deep Dive</a></li>
            <li><a href="#" class="nav-link">Advanced Topics</a></li>
          </ul>
        </div>
      </div>
    `;
    }
    if (toc) {
      if (!isMobile) {
        toc.style.display = 'none';
      }
      // On mobile, let CSS handle it - don't override
    }
  } else {
    // Documentation tab - show regular sidebar and TOC
    if (sidebar) {
      if (!isMobile) {
        sidebar.style.display = 'block';
        if (toc) {
          toc.style.display = 'block';
        }
      }
      // On mobile, sidebar is hidden by CSS - don't override
      
      sidebar.innerHTML = `
      <div class="sidebar-inner">
        <div class="sidebar-group">
          <div class="sidebar-group-title">Get Started</div>
          <ul>
            <li><a data-href="/get-started/quick-start" class="nav-link ${route === '/get-started/quick-start' ? 'active' : ''}">Quickstart</a></li>
            <li><a data-href="/get-started/dashboard-overview" class="nav-link ${route === '/get-started/dashboard-overview' ? 'active' : ''}">Dashboard Overview</a></li>
            <li><a data-href="/get-started/api-keys" class="nav-link ${route === '/get-started/api-keys' ? 'active' : ''}">API Keys</a></li>
          </ul>
        </div>

        <div class="sidebar-group">
          <div class="sidebar-group-title">Agents</div>
          <ul>
            <li><a data-href="/agents/create-agent" class="nav-link ${route === '/agents/create-agent' ? 'active' : ''}">Create Agent</a></li>
            <li><a data-href="/agents/agent-settings" class="nav-link ${route === '/agents/agent-settings' ? 'active' : ''}">Agent Settings</a></li>
            <li><a data-href="/agents/voice-configuration" class="nav-link ${route === '/agents/voice-configuration' ? 'active' : ''}">Voice Configuration</a></li>
            <li><a data-href="/agents/test-agent" class="nav-link ${route === '/agents/test-agent' || route === '/agents/test-your-agent' ? 'active' : ''}">Test Your Agent</a></li>
          </ul>
        </div>

        <div class="sidebar-group">
          <div class="sidebar-group-title">Phone System</div>
          <ul>
            <li><a data-href="/phone/add-sip-provider" class="nav-link ${route === '/phone/add-sip-provider' || route === '/phone-system/add-sip-provider' ? 'active' : ''}">Add SIP Provider</a></li>
            <li><a data-href="/phone/add-phone-number" class="nav-link ${route === '/phone/add-phone-number' || route === '/phone-system/add-phone-number' ? 'active' : ''}">Add Phone Number</a></li>
            <li><a data-href="/phone/call-routing" class="nav-link ${route === '/phone/call-routing' || route === '/phone-system/call-routing' ? 'active' : ''}">Call Routing</a></li>
            <li><a data-href="/phone/call-logs" class="nav-link ${route === '/phone/call-logs' || route === '/phone-system/call-logs' ? 'active' : ''}">Call Logs</a></li>
          </ul>
        </div>

        <div class="sidebar-group">
          <div class="sidebar-group-title">Campaigns</div>
          <ul>
            <li><a data-href="/campaigns/create-campaign" class="nav-link ${route === '/campaigns/create-campaign' ? 'active' : ''}">Create Campaign</a></li>
            <li><a data-href="/campaigns/dial-lists" class="nav-link ${route === '/campaigns/dial-lists' ? 'active' : ''}">Dial Lists</a></li>
            <li><a data-href="/campaigns/campaign-analytics" class="nav-link ${route === '/campaigns/campaign-analytics' ? 'active' : ''}">Campaign Analytics</a></li>
            <li><a data-href="/campaigns/do-not-call" class="nav-link ${route === '/campaigns/do-not-call' || route === '/campaigns/do-not-call-list' ? 'active' : ''}">Do Not Call List</a></li>
          </ul>
        </div>

        <div class="sidebar-group">
          <div class="sidebar-group-title">CRM</div>
          <ul>
            <li><a data-href="/crm/contacts" class="nav-link ${route === '/crm/contacts' ? 'active' : ''}">Contacts</a></li>
            <li><a data-href="/crm/leads" class="nav-link ${route === '/crm/leads' ? 'active' : ''}">Leads</a></li>
            <li><a data-href="/crm/accounts" class="nav-link ${route === '/crm/accounts' ? 'active' : ''}">Accounts</a></li>
            <li><a data-href="/crm/import-export" class="nav-link ${route === '/crm/import-export' || route === '/crm/import-export-data' ? 'active' : ''}">Import/Export Data</a></li>
          </ul>
        </div>

        <div class="sidebar-group">
          <div class="sidebar-group-title">Automations</div>
          <ul>
            <li><a data-href="/automations/smart-flows" class="nav-link ${route === '/automations/smart-flows' ? 'active' : ''}">Smart Flows</a></li>
            <li><a data-href="/automations/custom-tools" class="nav-link ${route === '/automations/custom-tools' ? 'active' : ''}">Custom Tools</a></li>
            <li><a data-href="/automations/webhooks" class="nav-link ${route === '/automations/webhooks' ? 'active' : ''}">Webhooks</a></li>
            <li><a data-href="/automations/integrations" class="nav-link ${route === '/automations/integrations' ? 'active' : ''}">Integrations</a></li>
          </ul>
        </div>

        <div class="sidebar-group">
          <div class="sidebar-group-title">Analytics</div>
          <ul>
            <li><a data-href="/analytics/dashboard" class="nav-link ${route === '/analytics/dashboard' || route === '/analytics/analytics-dashboard' ? 'active' : ''}">Analytics Dashboard</a></li>
            <li><a data-href="/analytics/reports" class="nav-link ${route === '/analytics/reports' ? 'active' : ''}">Reports</a></li>
            <li><a data-href="/analytics/costs" class="nav-link ${route === '/analytics/costs' || route === '/analytics/cost-management' ? 'active' : ''}">Cost Management</a></li>
          </ul>
        </div>

        <div class="sidebar-group">
          <div class="sidebar-group-title">Settings</div>
          <ul>
            <li><a data-href="/settings/team-management" class="nav-link ${route === '/settings/team-management' ? 'active' : ''}">Team Management</a></li>
            <li><a data-href="/settings/billing" class="nav-link ${route === '/settings/billing' ? 'active' : ''}">Billing</a></li>
            <li><a data-href="/settings/security" class="nav-link ${route === '/settings/security' ? 'active' : ''}">Security</a></li>
            <li><a data-href="/settings/white-label" class="nav-link ${route === '/settings/white-label' ? 'active' : ''}">White Label</a></li>
          </ul>
        </div>
      </div>
    `;
    
      // Re-attach event listeners for navigation links
      sidebar.querySelectorAll('[data-href]').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          navigateTo(link.getAttribute('data-href'));
        });
      });
    }
    
    if (toc) {
      if (!isMobile) {
        toc.style.display = 'block';
      }
      // On mobile, let CSS handle it - don't override
    }
  }
}

// Navigation updates
function updateNavigation(route) {
  // Update sidebar active state (both desktop and mobile)
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('data-href');
    if (href === route) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
  
  // Update mobile menu navigation active state
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileMenu) {
    mobileMenu.querySelectorAll('.nav-link').forEach(link => {
      const href = link.getAttribute('data-href');
      if (href === route) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }
  
  // Update top tabs
  document.querySelectorAll('.top-tab').forEach(tab => {
    const tabRoute = tab.getAttribute('data-top-tab');
    
    // Check if we're on a documentation page
    const isDocumentationRoute = route === '/' ||
                                  route.startsWith('/get-started/') ||
                                  route.startsWith('/agents/') ||
                                  route.startsWith('/phone/') ||
                                  route.startsWith('/campaigns/') ||
                                  route.startsWith('/crm/') ||
                                  route.startsWith('/automations/') ||
                                  route.startsWith('/analytics/') ||
                                  route.startsWith('/settings/');
    
    if ((isDocumentationRoute && tabRoute === '/') ||
        (route.startsWith('/api-reference') && tabRoute === '/api-reference') ||
        (route === '/videos' && tabRoute === '/videos')) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });
}

// Table of Contents
function updateTOC() {
  const activePage = document.querySelector('.page.active');
  const tocList = document.getElementById('toc-list');
  
  if (!activePage || !tocList) return;
  
  tocList.innerHTML = '';
  
  // Only look for H2 headings that are main sections
  const headings = activePage.querySelectorAll('h2');
  
  // Check if this is a quickstart/guide page with specific patterns
  const quickstartPatterns = [
    'What You\'ll Learn',
    'Step 1:', 'Step 2:', 'Step 3:', 'Step 4:', 'Step 5:', 'Step 6:',
    'Creating a New Agent', 'Testing the Agent', 'Configuring Agent Features',
    'Connecting a Phone Number', 'Making Live Calls', 'Additional Features in Imash',
    'What\'s Next', 'Whats Next',
    'Common Issues & Troubleshooting', 'Troubleshooting',
    'Need Help?', 'Support'
  ];
  
  // Check if any quickstart patterns exist in the page
  const isQuickstartPage = Array.from(headings).some(heading => {
    const text = heading.textContent;
    return quickstartPatterns.some(pattern => 
      text.startsWith(pattern) || text === pattern
    );
  });
  
  headings.forEach(heading => {
    // Skip TOC heading itself
    if (heading.textContent === "On This Page" || 
        heading.closest('#toc') || 
        heading.closest('.toc-container')) {
      return;
    }
    
    // For quickstart pages, filter headings
    if (isQuickstartPage) {
      const headingText = heading.textContent;
      const shouldInclude = quickstartPatterns.some(pattern => 
        headingText.startsWith(pattern) || headingText === pattern
      );
      
      if (!shouldInclude) return;
    }
    // For other pages (like introduction), include all H2 headings
    
    // Generate ID if not present
    if (!heading.id) {
      // Create ID from heading text
      const id = heading.textContent.toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-')      // Replace spaces with hyphens
        .replace(/-+/g, '-')       // Replace multiple hyphens with single
        .trim();
      heading.id = id;
    }
    
    // Skip if still no ID
    if (!heading.id) return;
    
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `#${heading.id}`;
    a.textContent = heading.textContent;
    a.addEventListener('click', (e) => {
      e.preventDefault();
      heading.scrollIntoView({ behavior: 'smooth' });
    });
    li.appendChild(a);
    tocList.appendChild(li);
  });
  
  // Intersection observer for active state
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const id = entry.target.id;
      const tocLink = tocList.querySelector(`a[href="#${id}"]`);
      if (tocLink) {
        if (entry.isIntersecting) {
          tocList.querySelectorAll('a').forEach(a => a.classList.remove('active'));
          tocLink.classList.add('active');
        }
      }
    });
  }, { rootMargin: '-100px 0px -70% 0px' });
  
  headings.forEach(heading => observer.observe(heading));
}

// API Sidebar
function initApiSidebar() {
  const sidebar = document.querySelector('.apiref-sidebar');
  if (!sidebar) return;
  
  // Build categories from both configs - ordered as requested
  const categories = {
    'Communications': [],
    'AI & Automation': [],
    'CRM': [],
    'Calendar': [],
    'System': []
  };
  
  // Map API info to categories based on table names
  const categoryMapping = {
    'api_start_calls': 'Communications',
    'crm_leads': 'CRM',
    'crm_contacts': 'CRM', 
    'crm_accounts': 'CRM',
    'crm_phone_numbers': 'CRM',
    'crm_notes': 'CRM',
    'campaigns': 'Communications',
    'callLogs': 'Communications',
    'phoneNumbers': 'Communications',
    'phoneProviders': 'Communications',
    'assistants': 'AI & Automation',
    'customTools': 'AI & Automation',
    'do_not_call': 'System',
    'internalUsers': 'System',
    'calendar_events': 'Calendar',
    'calendar_categories': 'Calendar',
    'calendar_event_participants': 'Calendar',
    'crm_settings': 'System'
  };
  
  // Build categories from apiInfoConfig
  Object.keys(apiInfoConfig).forEach(key => {
    const config = apiInfoConfig[key];
    if (!config) return;
    
    const tableName = config.tableName;
    const title = config.title || key;
    
    // Find matching category based on table name
    let category = null;
    for (const [tName, cat] of Object.entries(categoryMapping)) {
      if (tableName === tName) {
        category = cat;
        break;
      }
    }
    
    // If no category found, put in System by default
    if (!category) {
      category = 'System';
    }
    
    if (categories[category]) {
      categories[category].push({
        key: key,
        tableName: tableName,
        title: title,
        icon: getIconForTable(tableName)
      });
    }
  });
  
  // Build HTML
  let html = '';
  for (const [category, items] of Object.entries(categories)) {
    if (items.length === 0) continue;
    
    html += `<h3>${category}</h3><ul>`;
    items.forEach(item => {
      html += `
        <li>
          <a href="#" data-api-resource="${item.key}" data-table-name="${item.tableName}" class="${item.key === currentApiResource ? 'active' : ''}">
            <span class="api-icon">${item.icon}</span>
            ${item.title}
          </a>
        </li>
      `;
    });
    html += '</ul>';
  }
  
  // If no categories have items, show a message
  if (html === '') {
    html = '<p style="padding: 1rem; color: var(--text-secondary);">No API resources available</p>';
  }
  
  sidebar.innerHTML = html;
  
  // Add click handlers
  sidebar.querySelectorAll('[data-api-resource]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      selectApiResource(link.getAttribute('data-api-resource'));
    });
  });
}

// Get icon for table
function getIconForTable(tableName) {
  const icons = {
    api_start_calls: '📞',
    crm_leads: '👤',
    crm_contacts: '📇',
    crm_accounts: '🏢',
    crm_phone_numbers: '📞',
    crm_notes: '📋',
    campaigns: '📢',
    callLogs: '📝',
    assistants: '🤖',
    phoneNumbers: '☎️',
    phoneProviders: '📡',
    customTools: '🔧',
    do_not_call: '🚫',  // Fixed table name
    internalUsers: '👥',
    calendar_events: '📅',
    calendar_categories: '🏷️',
    calendar_event_participants: '👥',
    crm_settings: '⚙️'
  };
  
  return icons[tableName] || '📄';
}

// API Resource Selection
function selectApiResource(resourceKey) {
  currentApiResource = resourceKey;
  const apiConfig = apiInfoConfig[resourceKey];
  
  if (!apiConfig) {
    console.error('No config found for resource:', resourceKey);
    return;
  }
  
  // Update URL to include the API resource
  const newUrl = `/api-reference/${apiConfig.tableName}`;
  if (window.location.pathname !== newUrl) {
    // Only use pushState when not running in file:// protocol (local mode)
    if (window.location.protocol !== 'file:') {
      window.history.pushState({ route: newUrl, apiResource: resourceKey }, '', newUrl);
    }
    currentPage = newUrl;
  }
  
  // Update meta tags for the new API resource
  updateMetaForRoute(newUrl);
  
  // Update sidebar active state
  document.querySelectorAll('[data-api-resource]').forEach(link => {
    link.classList.toggle('active', link.getAttribute('data-api-resource') === resourceKey);
  });
  
  // Update header
  document.getElementById('api-title').textContent = apiConfig.title || resourceKey;
  document.getElementById('endpoint-resource').textContent = apiConfig.tableName;
  
  // Get system table configuration for excluded operations
  const tableName = apiConfig.tableName;
  let systemConfig = null;
  
  // Handle different possible structures of systemTableConfig
  if (Array.isArray(systemTableConfig)) {
    systemConfig = systemTableConfig.find(config => config.tableName === tableName);
  } else if (systemTableConfig && systemTableConfig.SYSTEM_TABLE_CONFIGS) {
    systemConfig = systemTableConfig.SYSTEM_TABLE_CONFIGS.find(config => config.tableName === tableName);
  } else if (systemTableConfig && systemTableConfig[tableName]) {
    systemConfig = systemTableConfig[tableName];
  }
  
  console.log('System config for', tableName, ':', systemConfig);
  console.log('Full systemTableConfig structure:', systemTableConfig);
  
  // Update supported operations
  const supported = document.getElementById('supported-operations');
  const allOperations = ['INSERT', 'SELECT', 'UPDATE', 'DELETE'];
  const labels = { INSERT: 'ADD', SELECT: 'LIST', UPDATE: 'UPDATE', DELETE: 'DELETE' };
  const colors = { INSERT: 'green', SELECT: 'blue', UPDATE: 'orange', DELETE: 'red' };
  
  // Start with API config supported operations or all operations
  let supportedOps = apiConfig.supportedOperations || allOperations;
  
  // Filter out excluded operations from system config
  if (systemConfig && systemConfig.excludedOperations) {
    const excludedOps = systemConfig.excludedOperations.map(op => op.toUpperCase());
    // Map 'insert' to 'INSERT' for consistency
    const mappedExcluded = excludedOps.map(op => op === 'INSERT' ? 'INSERT' : op);
    supportedOps = supportedOps.filter(op => !mappedExcluded.includes(op.toUpperCase()));
    console.log('Filtered operations for', tableName, ':', supportedOps, 'excluded:', excludedOps);
  }
  
  supported.innerHTML = supportedOps
    .map(op => `<span class="chip ${colors[op.toUpperCase()]}">${labels[op.toUpperCase()]}</span>`)
    .join('');
  
  // Update operation tabs
  document.querySelectorAll('.op-tab').forEach(btn => {
    const op = btn.getAttribute('data-op').toUpperCase();
    const isSupported = supportedOps.includes(op);
    btn.disabled = !isSupported;
    btn.style.display = isSupported ? '' : 'none';
  });
  
  // Reset to first available operation
  const firstOp = supportedOps[0]?.toLowerCase();
  if (firstOp) {
    selectOperation(firstOp === 'insert' ? 'insert' : firstOp);
  }
  
  // Update schema documentation
  updateSchemaDocumentation(apiConfig);
}

// Operation Selection
function selectOperation(operation) {
  currentOperation = operation;
  
  // Update tabs
  document.querySelectorAll('.op-tab').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-op') === operation);
  });
  
  // Show/hide relevant controls
  const selectControls = document.getElementById('select-controls');
  const updateDeleteControls = document.getElementById('update-delete-controls');
  const bodyControls = document.getElementById('body-controls');
  
  // Configure visibility based on operation
  if (operation === 'select') {
    selectControls.style.display = '';
    updateDeleteControls.style.display = 'none';
    bodyControls.style.display = 'none';
    
    // Reset the Record ID input and re-enable other fields
    const recordIdInput = document.getElementById('record-id-input');
    if (recordIdInput && recordIdInput.value === '') {
      // Trigger input event to reset the disabled states
      recordIdInput.dispatchEvent(new Event('input'));
    }
  } else if (operation === 'insert') {
    selectControls.style.display = 'none';
    updateDeleteControls.style.display = 'none';
    bodyControls.style.display = '';
    // Load example data automatically
    loadExampleData();
  } else if (operation === 'update') {
    selectControls.style.display = 'none';
    updateDeleteControls.style.display = '';
    bodyControls.style.display = '';
    // Load example data automatically
    loadExampleData();
  } else if (operation === 'delete') {
    selectControls.style.display = 'none';
    updateDeleteControls.style.display = '';
    bodyControls.style.display = 'none';
  }
  
  updateCodeSamples();
}

// Load Example Data
function loadExampleData() {
  const apiConfig = apiInfoConfig[currentApiResource];
  if (!apiConfig || !apiConfig.demoRecord) return;
  
  const bodyJson = document.getElementById('body-json');
  if (bodyJson) {
    const tableName = apiConfig.tableName;
    
    // Get system table configuration using same logic as selectApiResource
    let systemConfig = null;
    
    // Handle different possible structures of systemTableConfig
    if (Array.isArray(systemTableConfig)) {
      systemConfig = systemTableConfig.find(config => config.tableName === tableName);
    } else if (systemTableConfig && systemTableConfig.SYSTEM_TABLE_CONFIGS) {
      systemConfig = systemTableConfig.SYSTEM_TABLE_CONFIGS.find(config => config.tableName === tableName);
    } else if (systemTableConfig && systemTableConfig[tableName]) {
      systemConfig = systemTableConfig[tableName];
    }
    
    // Filter out excluded columns using system config
    const demoData = {};
    const excludedColumns = systemConfig?.excludedColumns || [];
    const readOnlyColumns = systemConfig?.readOnlyColumns || [];
    
    // Also filter out read-only columns for INSERT/UPDATE operations since they can't be modified
    const blockedColumns = [...excludedColumns, ...readOnlyColumns];
    
    Object.keys(apiConfig.demoRecord).forEach(key => {
      if (!blockedColumns.includes(key)) {
        demoData[key] = apiConfig.demoRecord[key];
      }
    });
    
    bodyJson.value = JSON.stringify(demoData, null, 2);
    updateCodeSamples();
  }
}

// Update Schema Documentation
function updateSchemaDocumentation(apiConfig) {
  const schemaContent = document.getElementById('schema-content');
  if (!schemaContent) return;
  
  const columns = apiConfig.columns || {};
  const tableName = apiConfig.tableName;
  
  // Get system table configuration using same logic as other functions
  let systemConfig = null;
  
  // Handle different possible structures of systemTableConfig
  if (Array.isArray(systemTableConfig)) {
    systemConfig = systemTableConfig.find(config => config.tableName === tableName);
  } else if (systemTableConfig && systemTableConfig.SYSTEM_TABLE_CONFIGS) {
    systemConfig = systemTableConfig.SYSTEM_TABLE_CONFIGS.find(config => config.tableName === tableName);
  } else if (systemTableConfig && systemTableConfig[tableName]) {
    systemConfig = systemTableConfig[tableName];
  }
  
  const excludedColumns = systemConfig?.excludedColumns || [];
  const readOnlyColumns = systemConfig?.readOnlyColumns || [];
  
  console.log('Schema - System config for', tableName, ':', systemConfig);
  console.log('Schema - Excluded columns:', excludedColumns);
  console.log('Schema - Read-only columns:', readOnlyColumns);
  
  let html = '';
  
  Object.entries(columns).forEach(([fieldName, fieldInfo]) => {
    // Skip excluded columns completely
    if (excludedColumns.includes(fieldName)) {
      return;
    }
    
    const isRequired = fieldInfo.required === true;
    const isReadOnly = readOnlyColumns.includes(fieldName);
    const fieldType = fieldInfo.type || (fieldInfo.options ? 'enum' : 'string');
    
    html += `
      <div class="field-item">
        <div class="field-header">
          <span class="field-name">${fieldName}</span>
          <span class="field-type">${fieldType}</span>
          ${isRequired ? '<span class="field-required">Required</span>' : ''}
          ${isReadOnly ? '<span class="field-readonly">Read Only</span>' : ''}
        </div>
        <div class="field-description">${fieldInfo.description || 'No description available'}</div>
        ${fieldInfo.options ? `
          <div class="field-options">
            Options: ${fieldInfo.options.map(opt => `<code>${opt}</code>`).join(', ')}
          </div>
        ` : ''}
      </div>
    `;
  });
  
  schemaContent.innerHTML = html || '<p>No schema information available for this resource.</p>';
}

// Code Sample Generation
function updateCodeSamples() {
  const apiKey = document.getElementById('api-key-input')?.value || 'YOUR_SECRET_API_KEY';
  const apiConfig = apiInfoConfig[currentApiResource];
  const tableName = apiConfig?.tableName || currentApiResource;
  
  // Get values based on current operation
  let recordId = '';
  if (currentOperation === 'update' || currentOperation === 'delete') {
    recordId = document.getElementById('update-record-id')?.value || '';
  } else if (currentOperation === 'select') {
    recordId = document.getElementById('record-id-input')?.value || '';
  }
  
  const limit = document.getElementById('limit-input')?.value || '10';
  const page = document.getElementById('page-input')?.value || '1';
  const orderBy = document.getElementById('order-input')?.value || 'created_at desc';
  const bodyJson = document.getElementById('body-json')?.value || '{}';
  
  const endpoint = `${API_BASE}/${tableName}`;
  
  // Generate cURL
  let curl = '';
  if (currentOperation === 'select') {
    let url = endpoint;
    const params = [];
    
    if (recordId) {
      // When Record ID is present, only include the ID parameter
      params.push(`id=${recordId}`);
    } else {
      // When no Record ID, include pagination parameters
      params.push(`limit=${limit}`, `page=${page}`, `order_by=${encodeURIComponent(orderBy)}`);
    }
    
    url += '?' + params.join('&');
    
    curl = `curl -X GET "${url}" \\
  -H "x-api-key: ${apiKey}"`;
  } else if (currentOperation === 'insert') {
    curl = `curl -X POST "${endpoint}" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${apiKey}" \\
  -d '${bodyJson}'`;
  } else if (currentOperation === 'update') {
    const url = recordId ? `${endpoint}/${recordId}` : endpoint;
    curl = `curl -X PUT "${url}" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${apiKey}" \\
  -d '${bodyJson}'`;
  } else if (currentOperation === 'delete') {
    const url = recordId ? `${endpoint}/${recordId}` : endpoint;
    curl = `curl -X DELETE "${url}" \\
  -H "x-api-key: ${apiKey}"`;
  }
  
  document.getElementById('code-curl').textContent = curl;
  
  // Generate JavaScript
  let js = '';
  if (currentOperation === 'select') {
    let url = endpoint;
    const params = [];
    
    if (recordId) {
      // When Record ID is present, only include the ID parameter
      params.push(`id=${recordId}`);
    } else {
      // When no Record ID, include pagination parameters
      params.push(`limit=${limit}`, `page=${page}`, `order_by=${encodeURIComponent(orderBy)}`);
    }
    
    url += '?' + params.join('&');
    
    js = `const response = await fetch('${url}', {
  headers: {
    'x-api-key': '${apiKey}'
  }
});
const data = await response.json();
console.log(data);`;
  } else if (currentOperation === 'insert') {
    js = `const response = await fetch('${endpoint}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': '${apiKey}'
  },
  body: JSON.stringify(${bodyJson})
});
const data = await response.json();
console.log(data);`;
  } else if (currentOperation === 'update') {
    const url = recordId ? `${endpoint}/${recordId}` : endpoint;
    js = `const response = await fetch('${url}', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': '${apiKey}'
  },
  body: JSON.stringify(${bodyJson})
});
const data = await response.json();
console.log(data);`;
  } else if (currentOperation === 'delete') {
    const url = recordId ? `${endpoint}/${recordId}` : endpoint;
    js = `const response = await fetch('${url}', {
  method: 'DELETE',
  headers: {
    'x-api-key': '${apiKey}'
  }
});
const data = await response.json();
console.log(data);`;
  }
  
  document.getElementById('code-js').textContent = js;
  
  // Generate Python
  let py = '';
  if (currentOperation === 'select') {
    let url = endpoint;
    const params = [];
    
    if (recordId) {
      // When Record ID is present, only include the ID parameter
      params.push(`id=${recordId}`);
    } else {
      // When no Record ID, include pagination parameters
      params.push(`limit=${limit}`, `page=${page}`, `order_by=${orderBy}`);
    }
    
    url += '?' + params.join('&');
    
    py = `import requests

response = requests.get(
    '${url}',
    headers={'x-api-key': '${apiKey}'}
)
data = response.json()
print(data)`;
  } else if (currentOperation === 'insert') {
    py = `import requests
import json

response = requests.post(
    '${endpoint}',
    headers={
        'Content-Type': 'application/json',
        'x-api-key': '${apiKey}'
    },
    data=json.dumps(${bodyJson})
)
data = response.json()
print(data)`;
  } else if (currentOperation === 'update') {
    const url = recordId ? `${endpoint}/${recordId}` : endpoint;
    py = `import requests
import json

response = requests.put(
    '${url}',
    headers={
        'Content-Type': 'application/json',
        'x-api-key': '${apiKey}'
    },
    data=json.dumps(${bodyJson})
)
data = response.json()
print(data)`;
  } else if (currentOperation === 'delete') {
    const url = recordId ? `${endpoint}/${recordId}` : endpoint;
    py = `import requests

response = requests.delete(
    '${url}',
    headers={'x-api-key': '${apiKey}'}
)
data = response.json()
print(data)`;
  }
  
  document.getElementById('code-py').textContent = py;
  
  // PHP
  document.getElementById('code-php').textContent = `<?php
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, '${endpoint}');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'x-api-key: ${apiKey}'
]);
$response = curl_exec($ch);
curl_close($ch);
echo $response;`;
  
  // Ruby
  document.getElementById('code-rb').textContent = `require 'net/http'
require 'json'

uri = URI('${endpoint}')
http = Net::HTTP.new(uri.host, uri.port)
http.use_ssl = true

request = Net::HTTP::Get.new(uri)
request['x-api-key'] = '${apiKey}'

response = http.request(request)
puts response.body`;
  
  // Go
  document.getElementById('code-go').textContent = `package main

import (
    "fmt"
    "net/http"
    "io/ioutil"
)

func main() {
    client := &http.Client{}
    req, _ := http.NewRequest("GET", "${endpoint}", nil)
    req.Header.Add("x-api-key", "${apiKey}")
    
    res, _ := client.Do(req)
    defer res.Body.Close()
    
    body, _ := ioutil.ReadAll(res.Body)
    fmt.Println(string(body))
}`;
}

// Try API Request
async function tryApiRequest() {
  const apiKey = document.getElementById('api-key-input')?.value;
  
  if (!apiKey || apiKey === 'YOUR_SECRET_API_KEY') {
    alert('Please enter your API key first');
    return;
  }
  
  const apiConfig = apiInfoConfig[currentApiResource];
  const tableName = apiConfig?.tableName || currentApiResource;
  
  // Get values based on current operation
  let recordId = '';
  if (currentOperation === 'update' || currentOperation === 'delete') {
    recordId = document.getElementById('update-record-id')?.value || '';
    if (!recordId) {
      alert('Please enter a Record ID for UPDATE/DELETE operations');
      return;
    }
  } else if (currentOperation === 'select') {
    recordId = document.getElementById('record-id-input')?.value || '';
  }
  
  const limit = document.getElementById('limit-input')?.value || '10';
  const page = document.getElementById('page-input')?.value || '1';
  const orderBy = document.getElementById('order-input')?.value || 'created_at desc';
  const bodyJson = document.getElementById('body-json')?.value || '{}';
  
  const endpoint = `${API_BASE}/${tableName}`;
  const responseBody = document.getElementById('response-body');
  const respStatus = document.getElementById('resp-status');
  
  responseBody.textContent = 'Loading...';
  respStatus.textContent = '...';
  respStatus.classList.remove('success', 'error');
  
  try {
    let response;
    
    if (currentOperation === 'select') {
      let url = endpoint;
      const params = [];
      
      if (recordId) {
        // When Record ID is present, only include the ID parameter
        params.push(`id=${recordId}`);
      } else {
        // When no Record ID, include pagination parameters
        params.push(`limit=${limit}`, `page=${page}`, `order_by=${encodeURIComponent(orderBy)}`);
      }
      
      url += '?' + params.join('&');
      
      response = await fetch(url, {
        headers: { 'x-api-key': apiKey }
      });
    } else if (currentOperation === 'insert') {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: bodyJson
      });
    } else if (currentOperation === 'update') {
      const url = `${endpoint}/${recordId}`;
      response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: bodyJson
      });
    } else if (currentOperation === 'delete') {
      const url = `${endpoint}/${recordId}`;
      response = await fetch(url, {
        method: 'DELETE',
        headers: { 'x-api-key': apiKey }
      });
    }
    
    const data = await response.json();
    
    respStatus.textContent = `${response.status} ${response.statusText}`;
    respStatus.classList.add(response.ok ? 'success' : 'error');
    
    responseBody.textContent = JSON.stringify(data, null, 2);
  } catch (error) {
    respStatus.textContent = 'Network Error';
    respStatus.classList.add('error');
    responseBody.textContent = error.message;
  }
}

// Mobile Menu Functions
function initMobileMenu() {
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileMenuClose = document.getElementById('mobile-menu-close');
  
  if (!mobileMenuBtn || !mobileMenu) return;
  
  // Store original body overflow style
  let originalBodyOverflow = '';
  
  // Open menu
  mobileMenuBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    originalBodyOverflow = document.body.style.overflow || '';
    
    // Update mobile menu content based on current tab
    updateMobileMenuContent();
    
    mobileMenu.classList.add('active');
    // Use a small delay to ensure the menu is visible before locking scroll
    setTimeout(() => {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    }, 10);
  });
  
  // Close menu
  mobileMenuClose?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeMobileMenu();
  });
  
  // Close menu when clicking outside
  mobileMenu.addEventListener('click', (e) => {
    if (e.target === mobileMenu) {
      closeMobileMenu();
    }
  });
  
  // Handle escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
      closeMobileMenu();
    }
  });
  
  // Function to restore body scroll
  function restoreBodyScroll() {
    document.body.style.overflow = originalBodyOverflow || '';
    document.body.style.position = '';
    document.body.style.width = '';
  }
  
  // Store restore function globally for use in closeMobileMenu
  window.restoreBodyScroll = restoreBodyScroll;
}

// Update mobile menu content based on active tab
function updateMobileMenuContent() {
  const mobileNav = document.querySelector('.mobile-nav');
  if (!mobileNav) return;
  
  // Determine which tab is active
  const activeTab = document.querySelector('.top-tab.active');
  const activeRoute = activeTab?.getAttribute('data-top-tab') || '/';
  
  let menuContent = '';
  
  if (activeRoute === '/api-reference') {
    // API Reference menu - ordered as requested
    const categories = {
      'Communications': [],
      'AI & Automation': [],
      'CRM': [],
      'Calendar': [],
      'System': []
    };
    
    const categoryMapping = {
      'api_start_calls': 'Communications',
      'crm_leads': 'CRM',
      'crm_contacts': 'CRM', 
      'crm_accounts': 'CRM',
      'crm_phone_numbers': 'CRM',
      'crm_notes': 'CRM',
      'campaigns': 'Communications',
      'callLogs': 'Communications',
      'phoneNumbers': 'Communications',
      'phoneProviders': 'Communications',
      'assistants': 'AI & Automation',
      'customTools': 'AI & Automation',
      'do_not_call': 'System',
      'internalUsers': 'System',
      'calendar_events': 'Calendar',
      'calendar_categories': 'Calendar',
      'calendar_event_participants': 'Calendar',
      'crm_settings': 'System'
    };
    
    // Build categories from apiInfoConfig
    Object.keys(apiInfoConfig).forEach(key => {
      const config = apiInfoConfig[key];
      if (!config) return;
      
      const tableName = config.tableName;
      const title = config.title || key;
      
      let category = null;
      for (const [tName, cat] of Object.entries(categoryMapping)) {
        if (tableName === tName) {
          category = cat;
          break;
        }
      }
      
      if (!category) category = 'System';
      
      if (categories[category]) {
        categories[category].push({
          key: key,
          tableName: tableName,
          title: title,
          icon: getIconForTable(tableName)
        });
      }
    });
    
    // Build HTML for API Reference
    for (const [category, items] of Object.entries(categories)) {
      if (items.length === 0) continue;
      
      menuContent += `
        <div class="sidebar-group">
          <div class="sidebar-group-title">${category}</div>
          <ul>`;
      
      items.forEach(item => {
        menuContent += `
          <li>
            <a href="#" class="nav-link api-link" data-api-resource="${item.key}">
              <span class="api-icon">${item.icon}</span>
              ${item.title}
            </a>
          </li>`;
      });
      
      menuContent += `</ul></div>`;
    }
    
  } else if (activeRoute === '/videos') {
    // Video Tutorials menu
    menuContent = `
      <div class="sidebar-group">
        <div class="sidebar-group-title">Video Categories</div>
        <ul>
          <li><a href="#getting-started" class="nav-link">Getting Started</a></li>
          <li><a href="#building-agents" class="nav-link">Building Agents</a></li>
          <li><a href="#api-deep-dive" class="nav-link">API Deep Dive</a></li>
          <li><a href="#advanced-topics" class="nav-link">Advanced Topics</a></li>
        </ul>
      </div>`;
      
  } else {
    // Documentation menu (default) - matches desktop sidebar
    menuContent = `
      <div class="sidebar-group">
        <div class="sidebar-group-title">Get Started</div>
        <ul>
          <li><a data-href="/get-started/quick-start" class="nav-link">Quickstart</a></li>
          <li><a data-href="/get-started/dashboard-overview" class="nav-link">Dashboard Overview</a></li>
          <li><a data-href="/get-started/api-keys" class="nav-link">API Keys</a></li>
        </ul>
      </div>
      
      <div class="sidebar-group">
        <div class="sidebar-group-title">Agents</div>
        <ul>
          <li><a data-href="/agents/create-agent" class="nav-link">Create Agent</a></li>
          <li><a data-href="/agents/agent-settings" class="nav-link">Agent Settings</a></li>
          <li><a data-href="/agents/voice-configuration" class="nav-link">Voice Configuration</a></li>
          <li><a data-href="/agents/test-agent" class="nav-link">Test Your Agent</a></li>
        </ul>
      </div>
      
      <div class="sidebar-group">
        <div class="sidebar-group-title">Phone System</div>
        <ul>
          <li><a data-href="/phone/add-sip-provider" class="nav-link">Add SIP Provider</a></li>
          <li><a data-href="/phone/add-phone-number" class="nav-link">Add Phone Number</a></li>
          <li><a data-href="/phone/call-routing" class="nav-link">Call Routing</a></li>
          <li><a data-href="/phone/call-logs" class="nav-link">Call Logs</a></li>
        </ul>
      </div>
      
      <div class="sidebar-group">
        <div class="sidebar-group-title">Campaigns</div>
        <ul>
          <li><a data-href="/campaigns/create-campaign" class="nav-link">Create Campaign</a></li>
          <li><a data-href="/campaigns/dial-lists" class="nav-link">Dial Lists</a></li>
          <li><a data-href="/campaigns/campaign-analytics" class="nav-link">Campaign Analytics</a></li>
          <li><a data-href="/campaigns/do-not-call" class="nav-link">Do Not Call List</a></li>
        </ul>
      </div>
      
      <div class="sidebar-group">
        <div class="sidebar-group-title">CRM</div>
        <ul>
          <li><a data-href="/crm/contacts" class="nav-link">Contacts</a></li>
          <li><a data-href="/crm/leads" class="nav-link">Leads</a></li>
          <li><a data-href="/crm/accounts" class="nav-link">Accounts</a></li>
          <li><a data-href="/crm/import-export" class="nav-link">Import/Export Data</a></li>
        </ul>
      </div>
      
      <div class="sidebar-group">
        <div class="sidebar-group-title">Automations</div>
        <ul>
          <li><a data-href="/automations/smart-flows" class="nav-link">Smart Flows</a></li>
          <li><a data-href="/automations/custom-tools" class="nav-link">Custom Tools</a></li>
          <li><a data-href="/automations/webhooks" class="nav-link">Webhooks</a></li>
          <li><a data-href="/automations/integrations" class="nav-link">Integrations</a></li>
        </ul>
      </div>
      
      <div class="sidebar-group">
        <div class="sidebar-group-title">Analytics</div>
        <ul>
          <li><a data-href="/analytics/dashboard" class="nav-link">Analytics Dashboard</a></li>
          <li><a data-href="/analytics/reports" class="nav-link">Reports</a></li>
          <li><a data-href="/analytics/costs" class="nav-link">Cost Management</a></li>
        </ul>
      </div>
      
      <div class="sidebar-group">
        <div class="sidebar-group-title">Settings</div>
        <ul>
          <li><a data-href="/settings/team-management" class="nav-link">Team Management</a></li>
          <li><a data-href="/settings/billing" class="nav-link">Billing</a></li>
          <li><a data-href="/settings/security" class="nav-link">Security</a></li>
          <li><a data-href="/settings/white-label" class="nav-link">White Label</a></li>
        </ul>
      </div>`;
  }
  
  mobileNav.innerHTML = menuContent;
  
  // Re-attach event listeners for navigation links
  mobileNav.querySelectorAll('[data-href]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const href = link.getAttribute('data-href');
      if (href) {
        closeMobileMenu();
        setTimeout(() => {
          navigateTo(href);
        }, 200);
      }
    });
  });
  
  // Attach event listeners for API links
  mobileNav.querySelectorAll('.api-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const resource = link.getAttribute('data-api-resource');
      if (resource) {
        closeMobileMenu();
        setTimeout(() => {
          selectApiResource(resource);
        }, 200);
      }
    });
  });
  
  // Update active states
  updateNavigation(currentPage);
}

function closeMobileMenu() {
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileMenu && mobileMenu.classList.contains('active')) {
    mobileMenu.classList.remove('active');
    // Restore scrolling using the stored function or fallback
    if (window.restoreBodyScroll) {
      window.restoreBodyScroll();
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
  }
}

// Event Listeners
function setupEventListeners() {
  // Theme toggle
  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
    
    // Re-render current page to update theme-specific images
    const activePage = document.querySelector('.page.active');
    if (activePage && activePage.id === 'dynamic-content') {
      // If we're on a dynamic content page, reload it
      loadDynamicContent(currentPage);
    }
  });
  
  // Navigation links
  document.querySelectorAll('[data-href]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(link.getAttribute('data-href'));
    });
  });
  
  // Top tabs
  document.querySelectorAll('.top-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(tab.getAttribute('data-top-tab'));
    });
  });
  
  // Operation tabs
  document.querySelectorAll('.op-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!btn.disabled) {
        selectOperation(btn.getAttribute('data-op'));
      }
    });
  });
  
  // Code tab buttons
  document.querySelectorAll('.code-tab-buttons button').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-lang');
      
      // Update active state
      btn.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Show corresponding code
      btn.closest('.code-tabs').querySelectorAll('.code').forEach(code => {
        code.classList.toggle('active', code.getAttribute('data-lang') === lang);
      });
    });
  });
  
  // Try button
  document.getElementById('try-btn')?.addEventListener('click', tryApiRequest);
  
  // Load example button removed - data loads automatically on tab change
  
  // Copy buttons
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = document.querySelector(btn.getAttribute('data-copy-target'));
      if (target) {
        const text = target.textContent;
        navigator.clipboard.writeText(text).then(() => {
          const originalText = btn.textContent;
          btn.textContent = 'Copied!';
          setTimeout(() => {
            btn.textContent = originalText;
          }, 2000);
        });
      }
    });
  });
  
  // Update code samples on input change
  ['api-key-input', 'record-id-input', 'update-record-id', 'limit-input', 'page-input', 'order-input', 'body-json'].forEach(id => {
    const elem = document.getElementById(id);
    if (elem) {
      elem.addEventListener('input', updateCodeSamples);
    }
  });
  
  // Add special handling for record-id-input to disable/enable other fields
  const recordIdInput = document.getElementById('record-id-input');
  const limitInput = document.getElementById('limit-input');
  const pageInput = document.getElementById('page-input');
  const orderInput = document.getElementById('order-input');
  
  if (recordIdInput) {
    // Store original label texts on load
    const controlItems = [limitInput, pageInput, orderInput].map(input => 
      input ? input.closest('.control-item') : null
    ).filter(Boolean);
    
    controlItems.forEach(item => {
      const label = item.querySelector('label');
      if (label && !label.hasAttribute('data-original-text')) {
        label.setAttribute('data-original-text', label.textContent);
      }
    });
    
    recordIdInput.addEventListener('input', (e) => {
      const hasValue = e.target.value.trim() !== '';
      
      // Disable/enable the other fields based on whether Record ID has a value
      if (limitInput) {
        limitInput.disabled = hasValue;
        limitInput.style.opacity = hasValue ? '0.6' : '1';
      }
      if (pageInput) {
        pageInput.disabled = hasValue;
        pageInput.style.opacity = hasValue ? '0.6' : '1';
      }
      if (orderInput) {
        orderInput.disabled = hasValue;
        orderInput.style.opacity = hasValue ? '0.6' : '1';
      }
      
      // Update the labels to show they're disabled
      controlItems.forEach(item => {
        const label = item.querySelector('label');
        if (label) {
          const originalText = label.getAttribute('data-original-text');
          if (hasValue) {
            label.style.opacity = '0.6';
            label.textContent = originalText + ' (disabled)';
          } else {
            label.textContent = originalText;
            label.style.opacity = '1';
          }
        }
      });
    });
  }
  
  // Search button (placeholder)
  document.getElementById('search-btn')?.addEventListener('click', () => {
    alert('Search coming soon!');
  });
  
  // Handle window resize to close mobile menu on desktop and update sidebar display
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      // Close mobile menu when switching to desktop
      if (window.innerWidth > 1200) {
        closeMobileMenu();
      }
      
      // Update sidebar display logic based on new screen size
      updateSidebarForTab(currentPage);
    }, 250);
  });
}

// Update origin placeholders
function updateOriginPlaceholders() {
  // Always use the API base URL for the origin display
  const apiOrigin = 'https://dashboard.imash.io';
  document.querySelectorAll('.origin').forEach(elem => {
    elem.textContent = apiOrigin;
  });
}

// Dynamic content loader function
async function loadDynamicContent(route) {
  const dynamicSection = document.getElementById('dynamic-content');
  if (!dynamicSection) return;
  
  // Determine base path for files - works for both local and deployed
  const getBasePath = () => {
    const currentPath = window.location.pathname;
    const currentHost = window.location.host;
    
    // Check if we're using Live Server (serves from repo root with /APP/docs/ in path)
    if (currentPath.includes('/APP/docs/')) {
      return 'APP/docs/files';
    }
    // Check if we're using local server (Python, Node, etc.) from docs directory
    else if (currentHost.includes('127.0.0.1') || currentHost.includes('localhost')) {
      return '/files';
    }
    // Deployed version (docs.imash.io)
    else {
      return '/files';
    }
  };
  
  const basePath = getBasePath();
  
  // Map routes to JSON content files
  const contentMap = {
    '/get-started/quick-start': `${basePath}/get-started/quick-start.json`,
    '/get-started/dashboard-overview': `${basePath}/get-started/dashboard-overview.json`,
    '/get-started/api-keys': `${basePath}/get-started/api-keys.json`,
    '/agents/create-agent': `${basePath}/agents/create-agent.json`,
    '/agents/agent-settings': `${basePath}/agents/agent-settings.json`,
    '/agents/voice-configuration': `${basePath}/agents/voice-configuration.json`,
    '/agents/test-your-agent': `${basePath}/agents/test-your-agent.json`,
    '/phone/add-sip-provider': `${basePath}/phone/add-sip-provider.json`,
    '/phone/add-phone-number': `${basePath}/phone/add-phone-number.json`,
    '/phone/call-routing': `${basePath}/phone/call-routing.json`,
    '/phone/call-logs': `${basePath}/phone/call-logs.json`,
    '/campaigns/create-campaign': `${basePath}/campaigns/create-campaign.json`,
    '/campaigns/dial-lists': `${basePath}/campaigns/dial-lists.json`,
    '/campaigns/campaign-analytics': `${basePath}/campaigns/campaign-analytics.json`,
    '/campaigns/do-not-call-list': `${basePath}/campaigns/do-not-call-list.json`,
    '/crm/contacts': `${basePath}/crm/contacts.json`,
    '/crm/leads': `${basePath}/crm/leads.json`,
    '/crm/accounts': `${basePath}/crm/accounts.json`,
    '/crm/import-export-data': `${basePath}/crm/import-export-data.json`,
    '/automations/smart-flows': `${basePath}/automations/smart-flows.json`,
    '/automations/custom-tools': `${basePath}/automations/custom-tools.json`,
    '/automations/webhooks': `${basePath}/automations/webhooks.json`,
    '/automations/integrations': `${basePath}/automations/integrations.json`,
    '/analytics/analytics-dashboard': `${basePath}/analytics/analytics-dashboard.json`,
    '/analytics/reports': `${basePath}/analytics/reports.json`,
    '/analytics/cost-management': `${basePath}/analytics/cost-management.json`,
    '/settings/team-management': `${basePath}/settings/team-management.json`,
    '/settings/billing': `${basePath}/settings/billing.json`,
    '/settings/security': `${basePath}/settings/security.json`,
    '/settings/white-label': `${basePath}/settings/white-label.json`
  };
  
  const jsonPath = contentMap[route];
  if (jsonPath) {
    try {
      // Fetch the JSON file
      console.log('Loading content from:', jsonPath);
      const response = await fetch(jsonPath);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const content = await response.json();
      console.log('Content loaded:', content);
      
      if (content) {
        const renderedHTML = renderContent(content);
        console.log('Rendered HTML length:', renderedHTML.length);
        dynamicSection.innerHTML = renderedHTML;
        dynamicSection.style.display = 'block';
        dynamicSection.setAttribute('data-route', route);
        
        // Re-attach event listeners for any new navigation links
        dynamicSection.querySelectorAll('[data-href]').forEach(link => {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(link.getAttribute('data-href'));
          });
        });
        
        // Update TOC after content loads
        updateTOC();
      }
    } catch (error) {
      console.error('Error loading content:', error);
      console.error('Error stack:', error.stack);
      // Show placeholder message if JSON doesn't exist
      const pageName = route.split('/').pop().replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      dynamicSection.innerHTML = `<h1>${pageName}</h1><p class="lede">Error loading content: ${error.message}</p>`;
      dynamicSection.style.display = 'block';
    }
  } else {
    // Show placeholder for unmapped routes
    const pageName = route.split('/').pop().replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    dynamicSection.innerHTML = `<h1>${pageName}</h1><p class="lede">This page is under development.</p>`;
    dynamicSection.style.display = 'block';
  }
}

// Function to render content from JS objects
function renderContent(content) {
  // Update page meta tags if they exist
  if (content.metaTitle || content.metaDescription || content.metaKeywords) {
    updatePageMeta(content);
  }
  
  let html = `<h1>${content.title}</h1>`;
  if (content.lede) {
    html += `<p class="lede">${content.lede}</p>`;
  }
  
  // Render content based on structure
  if (content.steps) {
    // Quickstart format
    html += renderQuickstartContent(content);
  } else {
    // Basic format
    if (content.sections && content.sections.length > 0) {
      content.sections.forEach(section => {
        html += `<section>${section}</section>`;
      });
    }
  }
  
  return html;
}

function renderQuickstartContent(content) {
  let html = '';
  
  // Add time to complete if available
  if (content.timeToComplete) {
    html += `<div class="time-to-complete">⏱️ Time to complete: ${content.timeToComplete}</div>`;
  }
  
  // Add what you will learn section if available
  if (content.whatYouWillLearn && content.whatYouWillLearn.length > 0) {
    html += '<div class="what-you-will-learn">';
    html += '<h2>What You\'ll Learn</h2>';
    html += '<ul>';
    content.whatYouWillLearn.forEach(item => {
      // Ensure item is converted to string properly
      const itemText = typeof item === 'string' ? item : (item.text || item.toString());
      html += `<li>${itemText}</li>`;
    });
    html += '</ul></div>';
  }

  if (content.steps) {
    content.steps.forEach(step => {
      html += `<h2 id="${step.id}">${step.title}</h2>${step.content}`;
      
      if (step.images) {
        // Get current theme
        const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        
        step.images.forEach(image => {
          // Skip images that don't match current theme
          if (image.theme && image.theme !== currentTheme && image.theme !== 'both') {
            return;
          }
          
          // Handle absolute paths - support http/https URLs and relative paths
          let imageSrc = image.src;
          if (!/^https?:\/\//.test(imageSrc) && !imageSrc.startsWith('/')) {
            imageSrc = `/${imageSrc}`;
          }
          html += `<div class="image-container ${image.theme || ''}" data-theme="${image.theme || 'both'}" style="text-align: center; margin: 1.5rem 0;">`;
          html += `<img src="${imageSrc}" alt="${image.alt}" style="width: 90%; max-width: 1200px; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />`;
          if (image.caption) {
            html += `<div class="image-caption" style="margin-top: 0.5rem; font-size: 0.9rem; color: var(--text-secondary); font-style: italic;">${image.caption}</div>`;
          }
          html += '</div>';
        });
      }

      if (step.codeExamples) {
        html += '<div class="code-examples">';
        html += '<div class="code-tabs">';
        html += '<div class="code-tab-buttons">';
        const languages = Object.keys(step.codeExamples);
        languages.forEach((lang, index) => {
          html += `<button data-lang="${lang}" class="${index === 0 ? 'active' : ''}">${lang.toUpperCase()}</button>`;
        });
        html += '</div>';
        languages.forEach((lang, index) => {
          // Escape HTML in code
          const escapedCode = step.codeExamples[lang]
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
          html += `<pre class="code ${index === 0 ? 'active' : ''}" data-lang="${lang}"><code>${escapedCode}</code></pre>`;
        });
        html += '</div></div>';
      }

      if (step.apiCall) {
        html += '<h3>Option 2: Use the API</h3>';
        // Escape HTML in API call
        const escapedApiCall = step.apiCall
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
        html += `<pre class="code"><code>${escapedApiCall}</code></pre>`;
      }
    });
  }

  if (content.nextSteps) {
    html += '<div class="next-steps">';
    html += `<h2>${content.nextSteps.title}</h2>`;
    html += `<p>${content.nextSteps.description}</p>`;
    html += '<div class="card-grid">';
    content.nextSteps.cards.forEach(card => {
      html += `<a class="card" data-href="${card.href}">`;
      html += `<div class="card-title">${card.title}</div>`;
      html += `<div class="card-desc">${card.description}</div>`;
      html += '</a>';
    });
    html += '</div></div>';
  }

  if (content.troubleshooting) {
    html += '<div class="troubleshooting">';
    html += `<h2>${content.troubleshooting.title}</h2>`;
    content.troubleshooting.sections.forEach(section => {
      html += `<h3>${section.title}</h3>`;
      html += '<ul>';
      section.points.forEach(point => {
        html += `<li>${point}</li>`;
      });
      html += '</ul>';
    });
    html += '</div>';
  }

  if (content.support) {
    html += '<div class="support">';
    html += `<h2>${content.support.title}</h2>`;
    html += content.support.content;
    html += '</div>';
  }

  return html;
}

// Import meta configuration
let metaConfig = null;
let apiResourceMeta = null;

// Load meta configuration
async function loadMetaConfig() {
  try {
    const module = await import('/metaConfig.js');
    metaConfig = module.metaConfig;
    apiResourceMeta = module.apiResourceMeta;
    return true;
  } catch (error) {
    console.error('Failed to load meta config:', error);
    return false;
  }
}

// Function to update page meta tags
function updatePageMeta(content) {
  // Update title tag
  if (content && content.metaTitle) {
    document.title = content.metaTitle;
  } else if (content && content.title) {
    document.title = `${content.title} | iMash Docs`;
  }
  
  // Update or create meta description
  let metaDescription = document.querySelector('meta[name="description"]');
  if (!metaDescription) {
    metaDescription = document.createElement('meta');
    metaDescription.name = 'description';
    document.head.appendChild(metaDescription);
  }
  if (content && content.metaDescription) {
    metaDescription.content = content.metaDescription;
  } else if (content && content.lede) {
    metaDescription.content = content.lede;
  }
  
  // Update or create meta keywords
  let metaKeywords = document.querySelector('meta[name="keywords"]');
  if (!metaKeywords) {
    metaKeywords = document.createElement('meta');
    metaKeywords.name = 'keywords';
    document.head.appendChild(metaKeywords);
  }
  if (content && content.metaKeywords) {
    metaKeywords.content = content.metaKeywords;
  }
}

// Function to update meta based on route
function updateMetaForRoute(route) {
  if (!metaConfig) return;
  
  // Check if this is an API reference route
  if (route.startsWith('/api-reference/')) {
    const resourceName = route.split('/api-reference/')[1];
    if (resourceName && apiResourceMeta) {
      const meta = apiResourceMeta[resourceName] || {
        title: `${resourceName} API`,
        description: `API documentation for ${resourceName} resource.`,
        keywords: `${resourceName}, API, REST API`
      };
      updatePageMeta({
        metaTitle: `${meta.title} - REST Endpoint Documentation | iMash API Reference`,
        metaDescription: meta.description,
        metaKeywords: meta.keywords
      });
    }
  } else {
    // Regular route
    const meta = metaConfig[route];
    if (meta) {
      updatePageMeta(meta);
    }
  }
}

// Make it globally available
window.loadDynamicContent = loadDynamicContent;

// Initialize code samples on load
window.addEventListener('load', () => {
  selectOperation('select');
  updateCodeSamples();
});
