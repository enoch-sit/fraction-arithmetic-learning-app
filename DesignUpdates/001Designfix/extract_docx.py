import os
from docx import Document
from docx.oxml.text.paragraph import CT_P
from docx.oxml.table import CT_Tbl
from docx.table import _Cell, Table
from docx.text.paragraph import Paragraph
import base64

def extract_images(doc, output_folder):
    """Extract images from document and save them"""
    images = []
    os.makedirs(output_folder, exist_ok=True)
    
    # Get all relationships (images are embedded as relationships)
    for rel_id, rel in doc.part.rels.items():
        if "image" in rel.target_ref:
            image_data = rel.target_part.blob
            # Get image extension
            image_ext = rel.target_ref.split('.')[-1]
            image_filename = f"image_{len(images) + 1}.{image_ext}"
            image_path = os.path.join(output_folder, image_filename)
            
            with open(image_path, 'wb') as f:
                f.write(image_data)
            
            images.append(image_filename)
            print(f"Extracted: {image_filename}")
    
    return images

def paragraph_to_markdown(paragraph, images_dict, image_counter):
    """Convert a paragraph to markdown"""
    text = paragraph.text.strip()
    
    if not text:
        return "", image_counter
    
    # Check if paragraph contains an image
    # Images in docx are stored in runs
    has_image = False
    for run in paragraph.runs:
        if 'graphic' in run._element.xml:
            has_image = True
            if image_counter < len(images_dict):
                text = f"![Image {image_counter + 1}](images/{images_dict[image_counter]})\n\n{text}"
                image_counter += 1
    
    # Apply formatting
    if paragraph.style.name.startswith('Heading 1'):
        return f"# {text}\n\n", image_counter
    elif paragraph.style.name.startswith('Heading 2'):
        return f"## {text}\n\n", image_counter
    elif paragraph.style.name.startswith('Heading 3'):
        return f"### {text}\n\n", image_counter
    elif paragraph.style.name.startswith('Heading 4'):
        return f"#### {text}\n\n", image_counter
    elif paragraph.style.name.startswith('List'):
        return f"- {text}\n", image_counter
    else:
        # Check if all runs are bold or italic
        if paragraph.runs:
            all_bold = all(run.bold for run in paragraph.runs if run.text.strip())
            all_italic = all(run.italic for run in paragraph.runs if run.text.strip())
            
            if all_bold:
                text = f"**{text}**"
            elif all_italic:
                text = f"*{text}*"
        
        return f"{text}\n\n", image_counter

def table_to_markdown(table):
    """Convert a table to markdown"""
    if not table.rows:
        return ""
    
    markdown = ""
    
    # Header row
    headers = [cell.text.strip() for cell in table.rows[0].cells]
    markdown += "| " + " | ".join(headers) + " |\n"
    markdown += "| " + " | ".join(["---"] * len(headers)) + " |\n"
    
    # Data rows
    for row in table.rows[1:]:
        cells = [cell.text.strip() for cell in row.cells]
        markdown += "| " + " | ".join(cells) + " |\n"
    
    markdown += "\n"
    return markdown

def docx_to_markdown(docx_path, output_path):
    """Convert Word document to Markdown"""
    doc = Document(docx_path)
    
    # Extract images
    images_folder = os.path.join(os.path.dirname(output_path), "images")
    images = extract_images(doc, images_folder)
    
    markdown_content = ""
    image_counter = 0
    
    # Process document elements
    for element in doc.element.body:
        if isinstance(element, CT_P):
            paragraph = Paragraph(element, doc)
            md_text, image_counter = paragraph_to_markdown(paragraph, images, image_counter)
            markdown_content += md_text
        elif isinstance(element, CT_Tbl):
            table = Table(element, doc)
            markdown_content += table_to_markdown(table)
    
    # Write markdown file
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(markdown_content)
    
    print(f"\n✅ Conversion complete!")
    print(f"📄 Markdown file: {output_path}")
    print(f"🖼️  Extracted {len(images)} images to: {images_folder}")
    
    return output_path

if __name__ == "__main__":
    docx_file = "designFix.docx"
    output_file = "designFix.md"
    
    docx_to_markdown(docx_file, output_file)
