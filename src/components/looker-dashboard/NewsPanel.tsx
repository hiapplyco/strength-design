
interface NewsPanelProps {
  title: string;
  details: string;
  highlights: string[];
  imageSrc?: string;
}

export function NewsPanel({ title, details, highlights, imageSrc }: NewsPanelProps) {
  return (
    <div className="looker-panel-content">
      <div className="looker-panel-header">
        <h2>Latest News</h2>
        <div className="looker-panel-actions">
          <button className="looker-icon-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="19" cy="12" r="1"></circle>
              <circle cx="5" cy="12" r="1"></circle>
            </svg>
          </button>
        </div>
      </div>
      
      <div className="looker-news">
        <div className="looker-news-content">
          <h3>{title}</h3>
          <p>{details}</p>
          
          <div className="looker-news-highlights">
            <h4>Highlights:</h4>
            <ul>
              {highlights.map((highlight, index) => (
                <li key={index}>{highlight}</li>
              ))}
            </ul>
          </div>
        </div>
        
        {imageSrc && (
          <div className="looker-news-image">
            <img src={imageSrc} alt="News" />
          </div>
        )}
      </div>
    </div>
  );
}
