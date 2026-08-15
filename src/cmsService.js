import { supabase } from './supabaseClient';

/**
 * ডাটাবেস থেকে CMS কন্টেন্ট ফেচ করার ফাংশন
 */
export async function fetchCMSContent() {
  try {
    const { data, error } = await supabase
      .from('cms_values')
      .select(`
        value,
        cms_fields (
          field_key
        )
      `);

    if (error) throw error;

    const contentMap = {};
    if (data) {
      data.forEach((item) => {
        if (item.cms_fields && item.cms_fields.field_key) {
          contentMap[item.cms_fields.field_key] = item.value;
        }
      });
    }
    return contentMap;
  } catch (err) {
    console.error('CMS Content Fetch Error:', err.message);
    return {};
  }
}

/**
 * কন্টেন্ট আপডেট করার ফাংশন (এডমিন প্যানেলের জন্য)
 */
export async function updateCMSContent(fieldKey, newValue) {
  try {
    const { data: fieldData, error: fieldError } = await supabase
      .from('cms_fields')
      .select('id')
      .eq('field_key', fieldKey)
      .single();

    if (fieldError) throw fieldError;

    const { error: upsertError } = await supabase
      .from('cms_values')
      .upsert(
        { field_id: fieldData.id, value: newValue, updated_at: new Date() },
        { onConflict: 'field_id' }
      );

    if (upsertError) throw upsertError;
    return { success: true };
  } catch (err) {
    console.error('CMS Update Error:', err.message);
    return { success: false, error: err.message };
  }
}
