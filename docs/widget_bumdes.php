<?php
/**
 * Widget Live Dashboard BUMDes Noto Mulyo Pulodarat
 * File ini dirancang untuk diletakkan di folder desa/widgets/ pada sistem OpenSID
 */
?>

<!-- Container Widget BUMDes -->
<div class="box box-primary box-solid widget-bumdes" style="margin-bottom: 20px; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <div class="box-header with-border" style="background-color: #1e3a8a; color: white; padding: 10px 15px;">
        <h3 class="box-title" style="margin: 0; font-size: 16px; font-weight: bold;">
            <i class="fa fa-bar-chart" style="margin-right: 8px;"></i> Statistik BUMDes
        </h3>
    </div>
    <div class="box-body" style="padding: 0; background: #f8fafc;">
        <!-- Penyesuaian tinggi (height) menjadi 500px agar muat di sidebar, bisa diubah jika perlu -->
        <iframe 
            src="https://bumdes-digital-iota.vercel.app/public-dashboard" 
            width="100%" 
            height="500px" 
            style="border: none; overflow: hidden;" 
            title="Live Statistik BUMDes Noto Mulyo"
            loading="lazy"
        ></iframe>
    </div>
</div>
