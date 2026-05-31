const CMS_MEDIA_BUCKET = 'cms-media'

/**
 * Builds a unique storage path for a CMS image upload.
 */
function buildStoragePath(fieldId: string, file: File): string {
  const ext = file.name.includes('.')
    ? file.name.slice(file.name.lastIndexOf('.'))
    : ''
  const safeExt = ext.toLowerCase().replace(/[^a-z0-9.]/g, '')
  return `${fieldId}/${crypto.randomUUID()}${safeExt}`
}

/**
 * Returns the public URL for an object in the CMS media bucket.
 */
export function getCmsMediaPublicUrl(storagePath: string): string {
  const config = useRuntimeConfig()
  const base = config.public.supabaseUrl.replace(/\/$/, '')
  return `${base}/storage/v1/object/public/${CMS_MEDIA_BUCKET}/${storagePath}`
}

/**
 * Uploads an image file to Supabase Storage and returns its public URL.
 */
export async function uploadCmsImage(
  fieldId: string,
  file: File,
): Promise<string> {
  const supabase = useSupabase()
  const path = buildStoragePath(fieldId, file)

  const { error } = await supabase.storage
    .from(CMS_MEDIA_BUCKET)
    .upload(path, file, {
      cacheControl: '31536000',
      upsert: false,
    })

  if (error) throw error

  return getCmsMediaPublicUrl(path)
}
