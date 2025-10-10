import os
import shutil

# Define file types to convert
SUPPORTED_EXTENSIONS = ('.html', '.css', '.js', '.php', '.txt', '.xml', '.json')

def convert_files_to_txt(source_dir, output_dir):
    """Convert files to .txt while preserving directory structure"""
    for root, dirs, files in os.walk(source_dir):
        # Skip node_modules and other large folders (optional)
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
            
        for file in files:
            if file.endswith(SUPPORTED_EXTENSIONS):
                src_path = os.path.join(root, file)
                rel_path = os.path.relpath(root, source_dir)
                dest_folder = os.path.join(output_dir, rel_path)
                
                # Create destination folder if needed
                os.makedirs(dest_folder, exist_ok=True)
                
                # Create new filename with .txt extension
                base_name = os.path.splitext(file)[0]
                dest_path = os.path.join(dest_folder, f"{base_name}.txt")
                
                try:
                    with open(src_path, 'r', encoding='utf-8') as infile:
                        content = infile.read()
                    
                    with open(dest_path, 'w', encoding='utf-8') as outfile:
                        # Add file header for reference
                        outfile.write(f"--- FILE: {os.path.join(rel_path, file)} ---\n")
                        outfile.write(content)
                        outfile.write("\n\n--- END OF FILE ---\n")
                        
                    print(f"Converted: {os.path.join(rel_path, file)}")
                except Exception as e:
                    print(f"Error processing {src_path}: {str(e)}")

if __name__ == "__main__":
    source_dir = os.getcwd()  # Current working directory
    output_dir = os.path.join(source_dir, "converted_files")
    
    # Remove existing output directory if it exists
    if os.path.exists(output_dir):
        shutil.rmtree(output_dir)
    
    convert_files_to_txt(source_dir, output_dir)
    print(f"\n✅ Conversion complete! Files saved to: {output_dir}")