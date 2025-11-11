import matplotlib.pyplot as plt
import numpy as np
import seaborn as sns

# Set style
plt.style.use('seaborn-v0_8-darkgrid')

def create_fixed_radar_chart(save_path='dilorenzo_radar_fixed.png'):
    """Create a fixed radar chart for DiLorenzo's mechanical assessment"""
    fig, ax = plt.subplots(figsize=(10, 10), subplot_kw=dict(projection='polar'))
    
    # Categories with better spacing and clearer labels
    categories = [
        'Leg Lift\n(58%)', 
        'Stride Length\n(85%)', 
        'Hip/Shoulder\nSeparation (55°)', 
        'Shoulder Rotation\n(175°)', 
        'Extension\n(6.5 ft)', 
        'Deceleration\n(Controlled)'
    ]
    
    # Scores based on "Optimal" ratings from report
    dilorenzo_scores = [9.5, 9.0, 10.0, 10.0, 9.5, 9.0]
    optimal_scores = [10, 10, 10, 10, 10, 10]
    
    # Calculate angles
    angles = np.linspace(0, 2*np.pi, len(categories), endpoint=False).tolist()
    
    # Close the circle
    dilorenzo_scores += dilorenzo_scores[:1]
    optimal_scores += optimal_scores[:1]
    angles += angles[:1]
    
    # Plot DiLorenzo's actual scores
    ax.plot(angles, dilorenzo_scores, 'o-', linewidth=3, 
            label='DiLorenzo Actual', color='#2E86AB', markersize=8)
    ax.fill(angles, dilorenzo_scores, alpha=0.25, color='#2E86AB')
    
    # Plot optimal scores
    ax.plot(angles, optimal_scores, 'o--', linewidth=2, 
            label='Optimal Range', color='#A23B72', alpha=0.8, markersize=6)
    ax.fill(angles, optimal_scores, alpha=0.1, color='#A23B72')
    
    # Customize the chart
    ax.set_xticks(angles[:-1])
    ax.set_xticklabels(categories, fontsize=11, fontweight='bold')
    ax.set_ylim(0, 10)
    ax.set_yticks([2, 4, 6, 8, 10])
    ax.set_yticklabels(['2', '4', '6', '8', '10'], fontsize=10)
    ax.grid(True, alpha=0.3)
    
    # Add title and legend
    plt.title('Jackson DiLorenzo - Mechanical Assessment\nRadar Chart (Actual Values)', 
              fontsize=16, fontweight='bold', pad=30)
    
    # Position legend outside the plot
    plt.legend(loc='upper right', bbox_to_anchor=(1.3, 1.0), fontsize=12)
    
    # Add overall grade annotation
    ax.text(0, -2, 'OVERALL MECHANICAL GRADE: A-\nAll metrics in optimal or near-optimal ranges', 
            ha='center', va='center', fontsize=12, fontweight='bold',
            bbox=dict(boxstyle="round,pad=0.5", facecolor='lightgreen', alpha=0.8))
    
    plt.tight_layout()
    plt.savefig(save_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"✅ Fixed radar chart saved: {save_path}")

if __name__ == "__main__":
    create_fixed_radar_chart()