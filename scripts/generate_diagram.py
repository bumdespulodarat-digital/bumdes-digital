import matplotlib.pyplot as plt
import os

def draw_diagram():
    fig, ax = plt.subplots(figsize=(10, 8), facecolor='white')
    ax.set_xlim(-4, 4)
    ax.set_ylim(0, 6)
    ax.axis('off')

    # Styling for nodes
    bbox_style = dict(boxstyle="round,pad=0.8", facecolor="#F0FDF4", edgecolor="#166534", linewidth=1.5)
    text_kwargs = dict(ha="center", va="center", fontsize=11, fontweight='bold', color="#1a1a1a", bbox=bbox_style, fontfamily='sans-serif')
    
    # Define nodes and coordinates
    nodes = {
        'N1': {'pos': (0, 5), 'label': 'PELANGGAN MEMBELI DI KASIR (POS)'},
        'N2L': {'pos': (-2, 4), 'label': 'STOK BERKURANG\n(Kartu Stok: OUT)'},
        'N2R': {'pos': (2, 4), 'label': 'BUKU KAS BERTAMBAH\n(Debit: Kas Masuk)'},
        'N3': {'pos': (0, 3), 'label': 'JURNAL UMUM OTOMATIS\n(Debit Kas = Kredit\nPendapatan + HPP)'},
        'N4L': {'pos': (-2, 2), 'label': 'BUKU BESAR\n(mutasi per akun)'},
        'N4R': {'pos': (2, 2), 'label': 'NERACA SALDO\n(total D = K)'},
        'N5L': {'pos': (-2, 1), 'label': 'LABA RUGI\n(+Pendapatan,\n-HPP, -Beban)'},
        'N5R': {'pos': (2, 1), 'label': 'NERACA\n(+Aset Kas,\n-Persediaan)'},
    }

    # Draw nodes
    for k, v in nodes.items():
        ax.text(v['pos'][0], v['pos'][1], v['label'], **text_kwargs)

    # Define edges (from_node, to_node)
    edges = [
        ('N1', 'N2L'),
        ('N1', 'N2R'),
        ('N2L', 'N3'),
        ('N2R', 'N3'),
        ('N3', 'N4L'),
        ('N3', 'N4R'),
        ('N4L', 'N5L'),
        ('N4R', 'N5R'),
    ]

    # Draw edges with orthogonal routing
    for e in edges:
        p1 = nodes[e[0]]['pos']
        p2 = nodes[e[1]]['pos']
        
        # Orthogonal arrows
        # We start from bottom of p1, go down halfway, then horizontal to p2.x, then down to p2 top.
        # But annotate allows connection styles. 
        # For simple orthogonal: angle, angle3, bar.
        
        # To make it look clean, we can manually draw lines if we want, but annotate is easier.
        connectionstyle = "bar,fraction=0.5" 
        if p1[0] == p2[0]:
            # straight line down
            connectionstyle = "arc3,rad=0"
        else:
            # step down
            if p1[1] > p2[1]: # going down
                connectionstyle = f"angle,angleA=-90,angleB=180,rad=5" if p1[0] > p2[0] else f"angle,angleA=-90,angleB=0,rad=5"

        # Actually, let's just use manual segments for perfectly clean orthogonal lines
        # or simple straight lines. Straight lines might be clean enough.
        # Let's try straight lines first, they often look fine in flowcharts if arranged in a grid.
        # Let's just use manual orthogonal drawing to be precise:
        
        # Mid-y point
        mid_y = (p1[1] + p2[1]) / 2.0
        
        # For N1 -> N2L / N2R
        if e[0] == 'N1':
            mid_y = 4.6
        elif e[1] == 'N3':
            mid_y = 3.4
        elif e[0] == 'N3':
            mid_y = 2.6
        
        color = "#4F46E5"
        lw = 2
        
        if p1[0] == p2[0]:
            # straight line
            ax.annotate('', xy=(p2[0], p2[1]+0.3), xytext=(p1[0], p1[1]-0.3),
                        arrowprops=dict(arrowstyle="->", color=color, lw=lw))
        else:
            # Draw line down from p1 to mid_y
            ax.plot([p1[0], p1[0]], [p1[1]-0.25, mid_y], color=color, lw=lw)
            # Draw horizontal line
            ax.plot([p1[0], p2[0]], [mid_y, mid_y], color=color, lw=lw)
            # Draw line down from mid_y to p2 with arrow
            ax.annotate('', xy=(p2[0], p2[1]+0.3), xytext=(p2[0], mid_y),
                        arrowprops=dict(arrowstyle="->", color=color, lw=lw))

    plt.tight_layout()
    
    out_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'public', 'screenshots'))
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, 'diagram_alur_transaksi.png')
    
    plt.savefig(out_path, dpi=300, bbox_inches='tight', transparent=True)
    print(f"Diagram saved to {out_path}")

if __name__ == '__main__':
    draw_diagram()
