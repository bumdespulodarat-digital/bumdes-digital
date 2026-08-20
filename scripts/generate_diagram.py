import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.path import Path
import os

def draw_diagram():
    fig, ax = plt.subplots(figsize=(12, 10), facecolor='white')
    ax.set_xlim(-6, 6)
    ax.set_ylim(0, 7)
    ax.axis('off')

    # Color palette
    colors = {
        'kasir': {'face': '#ECFCCB', 'edge': '#65A30D', 'text': '#3F6212'}, # lime-100, lime-600, lime-800
        'stok': {'face': '#DBEAFE', 'edge': '#2563EB', 'text': '#1E3A8A'},   # blue-100, blue-600, blue-900
        'kas': {'face': '#FEF3C7', 'edge': '#D97706', 'text': '#92400E'},    # amber-100, amber-600, amber-900
        'jurnal': {'face': '#F3E8FF', 'edge': '#9333EA', 'text': '#581C87'}, # purple-100, purple-600, purple-900
        'buku_besar': {'face': '#FCE7F3', 'edge': '#DB2777', 'text': '#831843'}, # pink-100
        'laporan': {'face': '#FFE4E6', 'edge': '#E11D48', 'text': '#881337'}, # rose-100
    }

    def draw_node(x, y, title, subtitle, color_key, width=3.2, height=1.0):
        c = colors[color_key]
        # Draw box
        box = mpatches.FancyBboxPatch((x - width/2, y - height/2), width, height,
                                      boxstyle="round,pad=0.1,rounding_size=0.15",
                                      facecolor=c['face'], edgecolor=c['edge'], linewidth=2, zorder=2)
        ax.add_patch(box)
        
        # Add Title
        ax.text(x, y + 0.15, title, ha="center", va="center", 
                fontsize=11, fontweight='bold', color=c['text'], fontfamily='sans-serif', zorder=3)
        # Add Subtitle
        ax.text(x, y - 0.2, subtitle, ha="center", va="center", 
                fontsize=9, color='#475569', fontfamily='sans-serif', zorder=3)

    # Nodes
    draw_node(0, 6, "KASIR (POS)", "Pelanggan membeli barang\ndan membayar di Kasir", 'kasir', width=4, height=0.9)
    
    draw_node(-3, 4.5, "MODUL STOK", "Stok Berkurang\n(Tercatat di Kartu Stok: OUT)", 'stok', width=3, height=0.9)
    draw_node(3, 4.5, "BUKU KAS", "Saldo Kas Bertambah\n(Pemasukan / Debit)", 'kas', width=3, height=0.9)
    
    draw_node(0, 3, "JURNAL UMUM (Otomatis)", "[Debit] Kas  =  [Kredit] Pendapatan\n[Debit] HPP  =  [Kredit] Persediaan", 'jurnal', width=4.5, height=0.9)
    
    draw_node(-3, 1.5, "BUKU BESAR", "Mutasi Saldo per Akun", 'buku_besar', width=2.8, height=0.8)
    draw_node(3, 1.5, "NERACA SALDO", "Total Saldo (Balance D=K)", 'buku_besar', width=2.8, height=0.8)
    
    draw_node(-3, 0.3, "LABA RUGI", "Laba Bersih\n(Pendapatan - HPP - Beban)", 'laporan', width=2.8, height=0.8)
    draw_node(3, 0.3, "NERACA", "Posisi Keuangan\n(Aset = Kewajiban + Ekuitas)", 'laporan', width=2.8, height=0.8)

    def draw_orthogonal_arrow(x1, y1, x2, y2, y_mid=None):
        if y_mid is None:
            y_mid = (y1 + y2) / 2
        # Path: (x1, y1) -> (x1, y_mid) -> (x2, y_mid) -> (x2, y2)
        verts = [(x1, y1), (x1, y_mid), (x2, y_mid), (x2, y2)]
        codes = [Path.MOVETO, Path.LINETO, Path.LINETO, Path.LINETO]
        path = Path(verts, codes)
        patch = mpatches.PathPatch(path, facecolor='none', edgecolor="#94A3B8", lw=2.5, zorder=1)
        ax.add_patch(patch)
        
        # Add arrow head at the end
        arrow = mpatches.FancyArrowPatch((x2, y2+0.01), (x2, y2),
                                         arrowstyle="-|>,head_width=5,head_length=8",
                                         color="#94A3B8", linewidth=2.5, zorder=1)
        ax.add_patch(arrow)

    # N1 to N2
    draw_orthogonal_arrow(0, 5.55, -3, 4.95, y_mid=5.25)
    draw_orthogonal_arrow(0, 5.55, 3, 4.95, y_mid=5.25)
    
    # N2 to N3
    draw_orthogonal_arrow(-3, 4.05, 0, 3.45, y_mid=3.75)
    draw_orthogonal_arrow(3, 4.05, 0, 3.45, y_mid=3.75)
    
    # N3 to N4
    draw_orthogonal_arrow(0, 2.55, -3, 1.9, y_mid=2.25)
    draw_orthogonal_arrow(0, 2.55, 3, 1.9, y_mid=2.25)

    # N4 to N5
    draw_orthogonal_arrow(-3, 1.1, -3, 0.7)
    draw_orthogonal_arrow(3, 1.1, 3, 0.7)
    
    # Title
    ax.text(0, 6.8, "DIAGRAM ALUR TRANSAKSI", ha="center", va="center", 
            fontsize=16, fontweight='bold', color="#166534", fontfamily='sans-serif')
    ax.text(0, 6.55, "Bagaimana 1 transaksi di Kasir otomatis mengalir ke seluruh Laporan Keuangan", 
            ha="center", va="center", fontsize=10, color="#64748B", fontfamily='sans-serif')

    plt.tight_layout()
    
    out_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'public', 'screenshots'))
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, 'diagram_alur_transaksi.png')
    
    plt.savefig(out_path, dpi=300, bbox_inches='tight', transparent=True)
    print(f"Diagram saved to {out_path}")

if __name__ == '__main__':
    draw_diagram()
