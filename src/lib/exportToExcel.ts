import * as XLSX from 'xlsx';

export const exportToExcel = (data: any[], filename: string, sheetName: string = 'Dados') => {
  // Criar workbook e worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);

  // Adicionar worksheet ao workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Gerar e baixar arquivo
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

// Export multi-sheet niche analysis
export const exportNicheAnalysis = (
  niches: any[],
  videos: any[],
  filename: string
) => {
  const wb = XLSX.utils.book_new();
  
  // Sheet 1: Resumo de Nichos
  const nicheSheet = niches.map(n => ({
    'Nicho': n.name,
    'Descrição': n.description,
    'Vídeos': n.videoIds.length,
    'Views Totais': n.metrics.totalViews,
    'Canais': n.metrics.uniqueChannels,
    'VPH Médio': n.metrics.avgVPH.toFixed(0),
    'Score Oportunidade': n.metrics.opportunityScore.toFixed(0),
    'Saturação': n.metrics.saturationScore.toFixed(0) + '%',
    'Tendência': (n.metrics.trendScore > 0 ? '+' : '') + n.metrics.trendScore.toFixed(0) + '%',
    'Palavras-Chave': n.keywords.join(', '),
    'Especificidade': n.specificity,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(nicheSheet), 'Resumo Nichos');
  
  // Sheet 2: Vídeos Detalhados
  const videosSheet = videos.map(v => ({
    'Título': v.title,
    'Canal': v.channelTitle,
    'Views': v.viewCount,
    'VPH': v.vph?.toFixed(0) || 0,
    'Score Viral': v.viralScore?.toFixed(0) || 0,
    'Idade (dias)': v.ageInDays,
    'Inscritos': v.subscriberCount,
    'Engajamento': (v.engagement * 100)?.toFixed(2) + '%',
    'URL': `https://youtube.com/watch?v=${v.id}`,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(videosSheet), 'Vídeos');
  
  // Sheet 3: Top Canais por Nicho
  const channelsData: any[] = [];
  niches.forEach(niche => {
    // Get unique channels for this niche
    const nicheVideos = videos.filter(v => niche.videoIds.includes(v.id));
    const channelMap = new Map();
    
    nicheVideos.forEach(v => {
      if (!channelMap.has(v.channelId)) {
        channelMap.set(v.channelId, {
          channel: v.channelTitle,
          subscribers: v.subscriberCount,
          videos: 1,
          totalViews: v.viewCount,
        });
      } else {
        const existing = channelMap.get(v.channelId);
        existing.videos++;
        existing.totalViews += v.viewCount;
      }
    });
    
    Array.from(channelMap.values()).forEach(ch => {
      channelsData.push({
        'Nicho': niche.name,
        'Canal': ch.channel,
        'Inscritos': ch.subscribers,
        'Vídeos no Nicho': ch.videos,
        'Views Totais': ch.totalViews,
        'Média Views/Vídeo': Math.round(ch.totalViews / ch.videos),
      });
    });
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(channelsData), 'Top Canais');
  
  XLSX.writeFile(wb, `${filename}.xlsx`);
};
