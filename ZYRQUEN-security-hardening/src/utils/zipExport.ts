import JSZip from 'jszip';
import { CodeFile, ProjectContext, SavedProject } from '../types';

export async function exportProjectToZip(project: ProjectContext | SavedProject): Promise<void> {
  const zip = new JSZip();
  const projName = project.projectName || project.name || 'codevoice-project';
  const folder = zip.folder(projName) || zip;

  // Add all code files
  project.files.forEach((file: CodeFile) => {
    folder.file(file.name, file.content);
  });

  // Add metadata info
  const metadata = {
    name: projName,
    framework: project.framework,
    description: project.description,
    features: project.features || [],
    exportedAt: new Date().toISOString(),
    generator: 'CodeVoice AI V5 Autonomous Coding Agent',
  };

  folder.file('project.config.json', JSON.stringify(metadata, null, 2));

  // Generate zip blob
  const content = await zip.generateAsync({ type: 'blob' });
  
  // Trigger download
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${projName.toLowerCase().replace(/\s+/g, '-')}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
