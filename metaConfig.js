// Centralized meta tag configuration for all documentation pages
export const metaConfig = {
  // Homepage
  '/': {
    metaTitle: 'iMash Documentation - AI Voice Agent Platform',
    metaDescription: 'Complete documentation for iMash platform. Build, test, deploy, and monitor AI voice agents with comprehensive guides and API reference.',
    metaKeywords: 'iMash documentation, AI voice agents, API documentation, voice automation, conversational AI platform'
  },
  
  // Get Started
  '/get-started/quick-start': {
    metaTitle: 'Quickstart Guide - Get Started with iMash in 5 Minutes',
    metaDescription: 'Create your first AI voice agent, generate API keys, and make your first API call. Step-by-step guide to get started with iMash platform.',
    metaKeywords: 'quickstart, getting started, iMash tutorial, AI agent setup, API key generation, first API call, voice agent creation'
  },
  '/get-started/dashboard-overview': {
    metaTitle: 'Dashboard Overview - Navigate iMash Platform Features',
    metaDescription: 'Explore the iMash dashboard interface. Learn about agents, phone system, campaigns, CRM, analytics, and settings navigation.',
    metaKeywords: 'dashboard, platform overview, navigation, user interface, control panel, iMash features, admin panel'
  },
  '/get-started/api-keys': {
    metaTitle: 'API Keys Management - Authentication & Security | iMash Docs',
    metaDescription: 'Generate and manage API keys for secure access to iMash platform. Learn about authentication, permissions, and best practices.',
    metaKeywords: 'API keys, authentication, security, access tokens, API authentication, credentials management, secure access'
  },
  
  // Agents
  '/agents/create-agent': {
    metaTitle: 'Create AI Agent - Build Voice Assistants | iMash Docs',
    metaDescription: 'Step-by-step guide to creating AI voice agents. Configure behavior, set up prompts, and deploy conversational AI assistants.',
    metaKeywords: 'create agent, AI assistant, voice agent, conversational AI, agent configuration, virtual assistant setup'
  },
  '/agents/agent-settings': {
    metaTitle: 'Agent Settings - Configure AI Behavior & Tools | iMash Docs',
    metaDescription: 'Configure advanced agent settings including custom tools, webhooks, integrations, and behavior parameters for your AI assistants.',
    metaKeywords: 'agent settings, configuration, custom tools, webhooks, agent behavior, AI parameters, advanced settings'
  },
  '/agents/voice-configuration': {
    metaTitle: 'Voice Configuration - Set Up AI Voice Settings | iMash Docs',
    metaDescription: 'Configure voice providers, models, and speech settings for your AI agents. Support for OpenAI, ElevenLabs, and more.',
    metaKeywords: 'voice configuration, TTS, text-to-speech, voice models, OpenAI voices, ElevenLabs, speech synthesis'
  },
  '/agents/test-your-agent': {
    metaTitle: 'Test Your Agent - Validate AI Performance | iMash Docs',
    metaDescription: 'Test your AI agents with phone calls and simulations. Debug conversations and validate agent behavior before deployment.',
    metaKeywords: 'test agent, debugging, simulation, agent testing, call testing, conversation validation, QA testing'
  },
  // Also handle the incorrect route used in sidebar
  '/agents/test-agent': {
    metaTitle: 'Test Your Agent - Validate AI Performance | iMash Docs',
    metaDescription: 'Test your AI agents with phone calls and simulations. Debug conversations and validate agent behavior before deployment.',
    metaKeywords: 'test agent, debugging, simulation, agent testing, call testing, conversation validation, QA testing'
  },
  
  // Phone System (both phone/ and phone-system/ paths)
  '/phone/add-sip-provider': {
    metaTitle: 'Add SIP Provider - Configure Telephony | iMash Docs',
    metaDescription: 'Connect SIP providers and configure telephony settings. Integrate with Twilio, Telnyx, and other VoIP providers.',
    metaKeywords: 'SIP provider, telephony, VoIP, Twilio, Telnyx, phone integration, SIP configuration, voice provider'
  },
  '/phone/add-phone-number': {
    metaTitle: 'Add Phone Number - Set Up Inbound/Outbound Calling | iMash Docs',
    metaDescription: 'Purchase and configure phone numbers for your AI agents. Set up local, toll-free, and international numbers.',
    metaKeywords: 'phone number, DID, toll-free, local number, international calling, phone provisioning, number purchase'
  },
  '/phone/call-routing': {
    metaTitle: 'Call Routing - Configure Call Flow Rules | iMash Docs',
    metaDescription: 'Set up intelligent call routing rules. Configure IVR, call forwarding, and agent assignment based on conditions.',
    metaKeywords: 'call routing, IVR, call flow, routing rules, call forwarding, intelligent routing, call distribution'
  },
  '/phone/call-logs': {
    metaTitle: 'Call Logs - Monitor AI Agent Call History | iMash Docs',
    metaDescription: 'Access detailed call logs, monitor AI agent performance, analyze call patterns, and review conversation transcripts. Track success rates and quality metrics.',
    metaKeywords: 'call logs, call history, AI agent calls, call analytics, call transcripts, call recordings, performance metrics, conversation details'
  },
  '/phone-system/add-sip-provider': {
    metaTitle: 'Add SIP Provider - Configure Telephony | iMash Docs',
    metaDescription: 'Connect SIP providers and configure telephony settings. Integrate with Twilio, Telnyx, and other VoIP providers.',
    metaKeywords: 'SIP provider, telephony, VoIP, Twilio, Telnyx, phone integration, SIP configuration, voice provider'
  },
  '/phone-system/add-phone-number': {
    metaTitle: 'Add Phone Number - Set Up Inbound/Outbound Calling | iMash Docs',
    metaDescription: 'Purchase and configure phone numbers for your AI agents. Set up local, toll-free, and international numbers.',
    metaKeywords: 'phone number, DID, toll-free, local number, international calling, phone provisioning, number purchase'
  },
  '/phone-system/call-routing': {
    metaTitle: 'Call Routing - Configure Call Flow Rules | iMash Docs',
    metaDescription: 'Set up intelligent call routing rules. Configure IVR, call forwarding, and agent assignment based on conditions.',
    metaKeywords: 'call routing, IVR, call flow, routing rules, call forwarding, intelligent routing, call distribution'
  },
  '/phone-system/call-logs': {
    metaTitle: 'Call Logs - Monitor AI Agent Call History | iMash Docs',
    metaDescription: 'Access detailed call logs, monitor AI agent performance, analyze call patterns, and review conversation transcripts. Track success rates and quality metrics.',
    metaKeywords: 'call logs, call history, AI agent calls, call analytics, call transcripts, call recordings, performance metrics, conversation details'
  },
  
  // Campaigns
  '/campaigns/create-campaign': {
    metaTitle: 'Create Campaign - Automated Outreach Campaigns | iMash Docs',
    metaDescription: 'Set up automated calling campaigns with AI agents. Configure dial lists, scheduling, and campaign objectives.',
    metaKeywords: 'create campaign, outbound calling, automated campaigns, dial lists, campaign management, outreach automation'
  },
  '/campaigns/dial-lists': {
    metaTitle: 'Dial Lists - Manage Campaign Contacts | iMash Docs',
    metaDescription: 'Create and manage dial lists for campaigns. Import contacts, set priorities, and configure calling sequences.',
    metaKeywords: 'dial lists, contact lists, campaign contacts, call queues, priority calling, contact management'
  },
  '/campaigns/campaign-analytics': {
    metaTitle: 'Campaign Analytics - Track Performance Metrics | iMash Docs',
    metaDescription: 'Analyze campaign performance with detailed metrics. Track conversion rates, call outcomes, and ROI.',
    metaKeywords: 'campaign analytics, performance metrics, conversion tracking, ROI analysis, campaign reports, success metrics'
  },
  '/campaigns/do-not-call-list': {
    metaTitle: 'Do Not Call List - Compliance Management | iMash Docs',
    metaDescription: 'Manage DNC lists for compliance. Import suppression lists and ensure regulatory compliance for calling campaigns.',
    metaKeywords: 'do not call, DNC list, compliance, suppression list, regulatory compliance, TCPA, call regulations'
  },
  // Also handle the incorrect route used in sidebar
  '/campaigns/do-not-call': {
    metaTitle: 'Do Not Call List - Compliance Management | iMash Docs',
    metaDescription: 'Manage DNC lists for compliance. Import suppression lists and ensure regulatory compliance for calling campaigns.',
    metaKeywords: 'do not call, DNC list, compliance, suppression list, regulatory compliance, TCPA, call regulations'
  },
  
  // CRM
  '/crm/contacts': {
    metaTitle: 'Contacts Management - CRM Features | iMash Docs',
    metaDescription: 'Manage customer contacts in the built-in CRM. Track interactions, notes, and communication history.',
    metaKeywords: 'contacts, CRM, customer management, contact database, customer records, interaction tracking'
  },
  '/crm/leads': {
    metaTitle: 'Leads Management - Track Sales Pipeline | iMash Docs',
    metaDescription: 'Manage leads through your sales pipeline. Track lead status, qualify prospects, and convert to customers.',
    metaKeywords: 'leads, sales pipeline, lead management, lead tracking, prospect management, lead conversion'
  },
  '/crm/accounts': {
    metaTitle: 'Accounts Management - Company Records | iMash Docs',
    metaDescription: 'Manage company accounts and organizations. Track multiple contacts per account and business relationships.',
    metaKeywords: 'accounts, companies, organizations, B2B CRM, account management, business relationships'
  },
  '/crm/import-export-data': {
    metaTitle: 'Import/Export Data - Bulk Data Operations | iMash Docs',
    metaDescription: 'Import and export CRM data in bulk. Support for CSV, Excel, and API-based data synchronization.',
    metaKeywords: 'data import, data export, CSV import, bulk operations, data migration, CRM sync, data transfer'
  },
  // Also handle the incorrect route used in sidebar
  '/crm/import-export': {
    metaTitle: 'Import/Export Data - Bulk Data Operations | iMash Docs',
    metaDescription: 'Import and export CRM data in bulk. Support for CSV, Excel, and API-based data synchronization.',
    metaKeywords: 'data import, data export, CSV import, bulk operations, data migration, CRM sync, data transfer'
  },
  
  // Automations
  '/automations/smart-flows': {
    metaTitle: 'Smart Flows - Visual Workflow Builder | iMash Docs',
    metaDescription: 'Build complex conversation flows with visual workflow builder. Create branching logic and conditional responses.',
    metaKeywords: 'smart flows, workflow builder, conversation flows, visual builder, branching logic, automation workflows'
  },
  '/automations/custom-tools': {
    metaTitle: 'Custom Tools - Extend Agent Capabilities | iMash Docs',
    metaDescription: 'Create custom tools and functions for AI agents. Integrate external APIs and add custom business logic.',
    metaKeywords: 'custom tools, API integration, custom functions, agent extensions, business logic, tool development'
  },
  '/automations/webhooks': {
    metaTitle: 'Webhooks - Real-time Event Notifications | iMash Docs',
    metaDescription: 'Configure webhooks for real-time notifications. Receive events for calls, messages, and agent interactions.',
    metaKeywords: 'webhooks, event notifications, real-time updates, API callbacks, event streaming, integration hooks'
  },
  '/automations/integrations': {
    metaTitle: 'Integrations - Connect Third-party Services | iMash Docs',
    metaDescription: 'Integrate with CRMs, helpdesks, and business tools. Connect Salesforce, HubSpot, Zendesk, and more.',
    metaKeywords: 'integrations, third-party services, CRM integration, Salesforce, HubSpot, Zendesk, API connections'
  },
  '/automations/mcp-servers': {
    metaTitle: 'MCP Servers - Model Context Protocol | iMash Docs',
    metaDescription: 'Configure Model Context Protocol servers for advanced AI capabilities. Extend agent context and knowledge.',
    metaKeywords: 'MCP servers, model context protocol, AI extensions, context management, knowledge base, advanced AI'
  },
  
  // Analytics
  '/analytics/analytics-dashboard': {
    metaTitle: 'Analytics Dashboard - Performance Overview | iMash Docs',
    metaDescription: 'Monitor AI agent performance with comprehensive analytics. Track KPIs, conversion rates, and system metrics.',
    metaKeywords: 'analytics dashboard, performance metrics, KPI tracking, data visualization, business intelligence, reporting'
  },
  '/analytics/reports': {
    metaTitle: 'Reports - Generate Custom Analytics | iMash Docs',
    metaDescription: 'Generate detailed reports on agent performance, call outcomes, and business metrics. Export and schedule reports.',
    metaKeywords: 'reports, custom analytics, report generation, data export, scheduled reports, business reporting'
  },
  '/analytics/cost-management': {
    metaTitle: 'Cost Management - Monitor Usage & Billing | iMash Docs',
    metaDescription: 'Track usage costs and manage billing. Monitor call minutes, API usage, and optimize spending.',
    metaKeywords: 'cost management, billing, usage tracking, cost optimization, expense monitoring, budget control'
  },
  // Also handle the incorrect routes used in sidebar
  '/analytics/dashboard': {
    metaTitle: 'Analytics Dashboard - Performance Overview | iMash Docs',
    metaDescription: 'Monitor AI agent performance with comprehensive analytics. Track KPIs, conversion rates, and system metrics.',
    metaKeywords: 'analytics dashboard, performance metrics, KPI tracking, data visualization, business intelligence, reporting'
  },
  '/analytics/costs': {
    metaTitle: 'Cost Management - Monitor Usage & Billing | iMash Docs',
    metaDescription: 'Track usage costs and manage billing. Monitor call minutes, API usage, and optimize spending.',
    metaKeywords: 'cost management, billing, usage tracking, cost optimization, expense monitoring, budget control'
  },
  
  // Settings
  '/settings/team-management': {
    metaTitle: 'Team Management - User Roles & Permissions | iMash Docs',
    metaDescription: 'Manage team members, assign roles, and control permissions. Configure access levels and team collaboration.',
    metaKeywords: 'team management, user roles, permissions, access control, team collaboration, user administration'
  },
  '/settings/billing': {
    metaTitle: 'Billing Settings - Payment & Subscription | iMash Docs',
    metaDescription: 'Manage billing, payment methods, and subscription plans. View invoices and update payment information.',
    metaKeywords: 'billing, payment methods, subscription, invoices, payment settings, credit management, pricing plans'
  },
  '/settings/security': {
    metaTitle: 'Security Settings - Account Protection | iMash Docs',
    metaDescription: 'Configure security settings including 2FA, API permissions, and audit logs. Protect your account and data.',
    metaKeywords: 'security settings, two-factor authentication, 2FA, API security, audit logs, account protection, data security'
  },
  '/settings/white-label': {
    metaTitle: 'White Label - Custom Branding Options | iMash Docs',
    metaDescription: 'Configure white-label settings for custom branding. Add your logo, colors, and domain for branded experience.',
    metaKeywords: 'white label, custom branding, private label, branded platform, custom domain, logo customization'
  },
  
  // Special Pages
  '/videos': {
    metaTitle: 'Video Tutorials - Learn iMash Platform Step-by-Step',
    metaDescription: 'Watch comprehensive video tutorials on using iMash. Learn to create AI agents, manage campaigns, use the API, and master advanced features.',
    metaKeywords: 'video tutorials, iMash tutorials, AI agent videos, platform walkthrough, video guides, training videos, how-to videos'
  },
  '/api-reference': {
    metaTitle: 'API Reference - Complete REST API Documentation | iMash',
    metaDescription: 'Complete API reference for iMash platform. RESTful endpoints for AI agents, CRM, campaigns, phone system, and more. Full CRUD operations with code examples.',
    metaKeywords: 'API reference, REST API, API documentation, endpoints, API integration, developer docs, API guide'
  }
};

// API Resource metadata
export const apiResourceMeta = {
  'api_start_calls': {
    title: 'Start Calls API',
    description: 'Initiate outbound calls with AI agents. Configure call parameters, agent selection, and custom variables.',
    keywords: 'start calls, outbound calls, API calls, voice API, call initiation, agent calls'
  },
  'crm_leads': {
    title: 'CRM Leads API',
    description: 'Manage leads in the CRM system. Create, read, update, and delete lead records with full API access.',
    keywords: 'CRM leads, lead management, lead API, sales leads, lead tracking, CRM API'
  },
  'crm_contacts': {
    title: 'CRM Contacts API',
    description: 'Manage contacts in the CRM. Full CRUD operations for contact records, phone numbers, and contact details.',
    keywords: 'CRM contacts, contact management, contact API, customer contacts, contact database'
  },
  'crm_accounts': {
    title: 'CRM Accounts API',
    description: 'Manage company accounts and organizations. Track business relationships and account hierarchies.',
    keywords: 'CRM accounts, company management, account API, business accounts, organization records'
  },
  'campaigns': {
    title: 'Campaigns API',
    description: 'Create and manage automated calling campaigns. Configure dial lists, scheduling, and campaign settings.',
    keywords: 'campaigns API, calling campaigns, campaign management, automated campaigns, outreach API'
  },
  'callLogs': {
    title: 'Call Logs API',
    description: 'Access detailed call logs and analytics. Retrieve call history, transcripts, and performance metrics.',
    keywords: 'call logs API, call history, call records, call analytics, call transcripts'
  },
  'assistants': {
    title: 'AI Assistants API',
    description: 'Manage AI voice assistants. Configure agent behavior, voice settings, and conversation flows.',
    keywords: 'AI assistants API, voice agents, virtual assistants, agent management, AI agents'
  },
  'phoneNumbers': {
    title: 'Phone Numbers API',
    description: 'Manage phone numbers for inbound and outbound calling. Purchase, configure, and route phone numbers.',
    keywords: 'phone numbers API, DID management, toll-free numbers, phone provisioning, number management'
  },
  'phoneProviders': {
    title: 'Phone Providers API',
    description: 'Configure SIP providers and telephony settings. Integrate with Twilio, Telnyx, and other VoIP providers.',
    keywords: 'phone providers API, SIP providers, VoIP configuration, telephony API, carrier integration'
  },
  'customTools': {
    title: 'Custom Tools API',
    description: 'Create and manage custom tools for AI agents. Extend agent capabilities with custom functions.',
    keywords: 'custom tools API, agent tools, custom functions, tool development, agent extensions'
  },
  'do_not_call': {
    title: 'Do Not Call API',
    description: 'Manage DNC lists for compliance. Import suppression lists and ensure regulatory compliance.',
    keywords: 'do not call API, DNC list, compliance API, suppression list, TCPA compliance'
  },
  'internalUsers': {
    title: 'Internal Users API',
    description: 'Manage team members and user accounts. Control access, permissions, and user settings.',
    keywords: 'internal users API, user management, team members, access control, user administration'
  },
  'calendar_events': {
    title: 'Calendar Events API',
    description: 'Manage calendar events and scheduling. Create, update, and track appointments and meetings.',
    keywords: 'calendar events API, scheduling API, appointments, event management, calendar integration'
  },
  'calendar_categories': {
    title: 'Calendar Categories API',
    description: 'Organize calendar events with categories. Manage event types and categorization.',
    keywords: 'calendar categories API, event categories, calendar organization, event types'
  },
  'calendar_event_participants': {
    title: 'Event Participants API',
    description: 'Manage participants for calendar events. Track attendees and participant details.',
    keywords: 'event participants API, attendees, participant management, event attendance'
  },
  'crm_settings': {
    title: 'CRM Settings API',
    description: 'Configure CRM system settings. Manage custom fields, workflows, and CRM configuration.',
    keywords: 'CRM settings API, configuration API, custom fields, CRM customization, system settings'
  }
};

// Export functions to get meta data
export function getMetaForRoute(route) {
  return metaConfig[route] || null;
}

export function getApiResourceMeta(resourceName) {
  return apiResourceMeta[resourceName] || {
    title: `${resourceName} API`,
    description: `API documentation for ${resourceName} resource. Full CRUD operations and endpoint reference.`,
    keywords: `${resourceName}, API, REST API, endpoint, documentation`
  };
}
