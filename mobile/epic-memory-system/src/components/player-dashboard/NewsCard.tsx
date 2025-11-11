
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Newspaper } from "lucide-react";

interface NewsCardProps {
  title: string;
  details: string;
  highlights: string[];
  imageSrc?: string;
}

export function NewsCard({ title, details, highlights, imageSrc }: NewsCardProps) {
  return (
    <Card className="animate-in opacity-0 transition-all duration-300 delay-350">
      <CardHeader className="flex flex-row items-start space-x-4">
        <div className="bg-blue-100 text-blue-600 rounded-full p-2">
          <Newspaper className="h-5 w-5" />
        </div>
        <div>
          <CardTitle className="text-xl">Latest News</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <h3 className="font-bold text-lg mb-2">{title}</h3>
            <p className="text-muted-foreground mb-4">{details}</p>
            
            <div className="space-y-2">
              <h4 className="font-semibold">Performance Highlights:</h4>
              <ul className="space-y-1">
                {highlights.map((highlight, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-primary">•</span>
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-4">
              <Badge variant="secondary">Transfer Portal</Badge>
              <Badge variant="secondary">Division I</Badge>
              <Badge variant="secondary">2024-25 Season</Badge>
            </div>
          </div>
          
          {imageSrc && (
            <div className="relative h-64 md:h-full overflow-hidden rounded-md">
              <img 
                src={imageSrc} 
                alt="Player News" 
                className="object-cover h-full w-full"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
