// Test script to verify Supabase bucket access
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://oaggacxmirjlpgnevzqz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hZ2dhY3htaXJqbHBnbmV2enF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2NjcyNTQsImV4cCI6MjA4MDI0MzI1NH0.87b8C2uzhOxTXfbzFTBYEWUBoflLk33V1ab9DVsgDEA'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testSupabase() {
    console.log('Testing Supabase connection...')

    // Test 1: List buckets
    console.log('\n=== Test 1: List Buckets ===')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

    if (bucketsError) {
        console.error('Error listing buckets:', bucketsError)
    } else {
        console.log('Buckets found:')
        buckets.forEach(bucket => {
            console.log(`  - ${bucket.name} (${bucket.public ? 'PUBLIC' : 'PRIVATE'})`)
        })
    }

    // Test 2: Try to upload a test file
    console.log('\n=== Test 2: Upload Test File ===')
    const testFile = new File(['Hello World'], 'test.txt', { type: 'text/plain' })
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('workspace-files')
        .upload(`test-${Date.now()}.txt`, testFile)

    if (uploadError) {
        console.error('Upload error:', uploadError)
        console.error('Error details:', JSON.stringify(uploadError, null, 2))
    } else {
        console.log('Upload successful!')
        console.log('Path:', uploadData.path)
    }
}

testSupabase().then(() => {
    console.log('\n=== Test Complete ===')
}).catch(err => {
    console.error('Test failed:', err)
})
