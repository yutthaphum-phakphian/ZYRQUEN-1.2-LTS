import fs from 'fs';

let content = fs.readFileSync('src/components/views/Security/LiveFlowVisualizerView.tsx', 'utf-8');

// Replace the array literal but we must be careful with regex
// Actually we can just find 'export const LiveFlowVisualizerView: React.FC = () => {'
content = content.replace(
    /export const LiveFlowVisualizerView: React\.FC = \(\) => {/,
    `export const LiveFlowVisualizerView: React.FC = () => {
    const [timelineData, setTimelineData] = useState<any[]>([]);

    useEffect(() => {
        fetch('/api/v1/forensic/trace-replay')
            .then(res => res.json())
            .then(data => {
                if (data && data.stages) {
                    setTimelineData(data.stages);
                }
            })
            .catch(console.error);
    }, []);`
);

// We need to rename the old timelineData so it doesn't conflict.
content = content.replace(/const timelineData = \[/g, 'const OLD_timelineData = [');

fs.writeFileSync('src/components/views/Security/LiveFlowVisualizerView.tsx', content);
