import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://doldvhllfmxnpababugw.supabase.co";
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvbGR2aGxsZm14bnBhYmFidWd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMDQzMzEsImV4cCI6MjA3NDc4MDMzMX0.FjW1uShBHSD99KN97Jos0yWnGOeV4Ed_VcyEQgCzfWk';
export const supabase = createClient(supabaseUrl, supabaseKey);
