export function publicSettings(settings:any) {
 const safe:any={};
 for(const key of ['public_contact','shipping','checkout','about_us','privacy_policy','terms_of_service','seo','social_links','contact','theme','loyalty_earning_rate','loyalty_redemption_rate']) if(settings?.[key]!==undefined)safe[key]=settings[key];
 safe.loyalty_program_enabled=false;
 safe.integrations={};for(const key of ['facebook_pixels','tiktok_pixels','snapchat_pixels','google_analytics_ids'])if(settings?.integrations?.[key])safe.integrations[key]=settings.integrations[key];
 return safe;
}
