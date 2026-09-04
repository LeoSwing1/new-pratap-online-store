'use strict';
/**
 * New Pratap Tools — Integration Registry V35
 * One canonical registry for the 30 production integration domains.
 * Provider credentials are always server-side.
 */
const connectors = [
  ['supabase','Supabase / PostgreSQL',['Supabase'],['database','sync']],
  ['auth','Customer Authentication',['Firebase Auth','Supabase Auth','Custom OTP'],['otp','identity']],
  ['realtime','Realtime Sync',['Supabase Realtime','SSE/Polling'],['realtime','events']],
  ['storage','Cloud Storage',['Supabase Storage','S3-compatible'],['media','documents']],
  ['payment','Payment Gateway',['Razorpay','Cashfree Payments','PhonePe','PayU'],['checkout','payments']],
  ['webhooks','Payment Verification & Webhooks',['Razorpay Webhooks','Cashfree Webhooks','Custom HMAC'],['verify','webhooks']],
  ['courier','Courier & Shipment',['Shiprocket','Delhivery','DTDC','Blue Dart','XpressBees'],['shipment','rates']],
  ['tracking','AWB & Live Tracking',['Shiprocket','Delhivery','Courier APIs'],['tracking','awb']],
  ['whatsapp','WhatsApp Business',['WhatsApp Business Cloud API'],['messages','templates']],
  ['email','Transactional Email',['Resend','SendGrid','SMTP'],['otp','orders','marketing']],
  ['sms','SMS / OTP',['MSG91','Twilio'],['otp','alerts']],
  ['push','Browser Push / FCM',['Firebase Cloud Messaging'],['browser-push','offers']],
  ['invoice','Invoice & GST',['Built-in GST engine','External invoice API'],['invoice','gst']],
  ['analytics','Analytics',['Google Analytics 4'],['events','conversion']],
  ['merchant','Google Merchant / Shopping',['Google Merchant Center'],['feed','products']],
  ['support','Support & Smart Assistant',['Freshdesk','Intercom','Custom'],['support','handoff']],
  ['maps','Google Maps & Address Intelligence',['Google Maps Platform'],['geocode','address']],
  ['reviews','Reviews & Ratings',['Built-in reviews','External reviews API'],['reviews','moderation']],
  ['search','Advanced Search & Smart Filters',['Built-in search','External search API'],['search','filters']],
  ['supplier','Supplier & Purchase Management',['Custom Supplier API'],['purchasing','receiving']],
  ['accounting','Accounting Integration',['TallyPrime','Zoho Books','QuickBooks'],['ledger','tax']],
  ['catalog','WhatsApp Product Catalogue',['WhatsApp Catalogue'],['catalog','publish']],
  ['abandoned','Abandoned Cart Recovery',['Email/SMS/WhatsApp'],['recovery','campaigns']],
  ['meta','Meta Ads & Conversion Tracking',['Meta Pixel','Conversions API'],['events','attribution']],
  ['googleads','Google Ads Conversion Tracking',['Google Ads'],['conversion','attribution']],
  ['security','Security & Monitoring',['Sentry','OpenTelemetry'],['errors','audit']],
  ['backup','Automated Backups & Recovery',['Render/S3-compatible','Scheduled export'],['backup','restore']],
  ['crm','CRM & Customer Intelligence',['Zoho CRM','HubSpot'],['crm','segments']],
  ['live-support','Live Human Support',['Freshdesk','Intercom','Custom inbox'],['tickets','agents']],
  ['warehouse','Multi-Store & Warehouse',['Custom Multi-Warehouse API'],['inventory','fulfillment']]
].map(([id,name,providers,capabilities])=>({id,name,providers,capabilities}));

const byId = Object.fromEntries(connectors.map(c=>[c.id,c]));
function list(){return connectors.slice();}
function get(id){return byId[id]||null;}
function summary(configured={}){return {total:connectors.length,configured:connectors.filter(c=>configured[c.id]).length,connectors:connectors.map(c=>({...c,configured:!!configured[c.id]}))};}
module.exports={connectors,list,get,summary};
