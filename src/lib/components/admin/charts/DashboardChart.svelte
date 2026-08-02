<script lang="ts">
    import { onMount } from 'svelte';
    import {
        Chart,
        LineController,
        LineElement,
        PointElement,
        CategoryScale,
        LinearScale,
        Title,
        Tooltip,
        Legend,
        Filler
    } from 'chart.js/auto';
    // Importation des types stricts de Chart.js
    import type { ChartConfiguration, Plugin } from 'chart.js';

    interface Props {
        data: number[];
        labels: string[];
        typeChart?: 'line' | 'bar' | 'pie';
        title: string;
        width?: string;
    }
    let { data, labels, typeChart = 'line', title, width = 'h-80' }: Props = $props();

    Chart.register(
        LineController,
        LineElement,
        PointElement,
        CategoryScale,
        LinearScale,
        Title,
        Tooltip,
        Filler,
        Legend
    );

    let canvas: HTMLCanvasElement;
    let chart: Chart;

    // --- NOUVEAU : Définition du plugin de la ligne verticale ---
    // --- NOUVEAU : Définition du plugin de la ligne verticale (Typé correctement) ---
    const verticalLinePlugin: Plugin = {
        id: 'verticalLine',
        afterDraw: (chart) => {
            // On utilise l'API publique au lieu de la propriété privée _active
            const activeElements = chart.getActiveElements();

            if (activeElements.length > 0) {
                const ctx = chart.ctx;
                
                // On force le typage "any" car TypeScript ne sait pas par défaut 
                // que cet élément (un PointElement) possède une coordonnée x
                const x = (activeElements[0].element as { x: number }).x;
                
                const topY = chart.scales.y.top;
                const bottomY = chart.scales.y.bottom;

                ctx.save();
                ctx.beginPath();
                ctx.moveTo(x, topY);
                ctx.lineTo(x, bottomY);
                ctx.lineWidth = 1;
                ctx.strokeStyle = '#94a3b8'; // Couleur slate-400 assortie à vos axes
                ctx.setLineDash([4, 4]); // Ligne pointillée
                ctx.stroke();
                ctx.restore();
            }
        }
    };
    // -------------------------------------------------------------
    // -------------------------------------------------------------

    onMount(() => {
        let config: ChartConfiguration;

        if (typeChart === 'line') {
            config = {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Ventes',
                            data: data,
                            fill: true,
                            backgroundColor: 'rgba(14, 116, 144, 0.05)',
                            borderColor: '#0e7490',
                            borderWidth: 2,
                            pointBorderWidth: 1.5,
                            pointBorderColor: '#0e7490',
                            pointBackgroundColor: '#ffffff',
                            pointHoverRadius: 6,
                            tension: 0.35
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    // --- NOUVEAU : Configuration aimantée (crosshair) ---
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    },
                    // ----------------------------------------------------
                    animation: {
                        duration: 1000,
                        easing: 'easeOutQuart'
                    },
                    plugins: {
                        legend: { display: false },
                        title: {
                            display: true,
                            text: title,
                            align: 'start',
                            color: '#1e293b',
                            font: { size: 14, family: 'sans-serif' },
                            padding: { bottom: 10 }
                        },
                        tooltip: {
                            backgroundColor: '#0f172a',
                            padding: 10,
                            cornerRadius: 8
                        }
                    },
                    scales: {
                        x: {
                            grid: { display: false },
                            ticks: { color: '#94a3b8', font: { size: 11 } }
                        },
                        y: {
                            grid: { 
                                color: '#f1f5f9',
                            },
                            ticks: { color: '#94a3b8', font: { size: 11 } }
                        }
                    }
                },
                // --- NOUVEAU : Injection du plugin ---
                plugins: [verticalLinePlugin]
            };
        } else if (typeChart === 'pie') {
            config = {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            data: data,
                            backgroundColor: [
                                '#0e7490',
                                '#10b981',
                                '#f43f5e'
                            ],
                            borderWidth: 2,
                            borderColor: '#ffffff',
                            hoverOffset: 6
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                boxWidth: 12,
                                padding: 15,
                                color: '#64748b',
                                font: { size: 11 }
                            }
                        }
                    }
                }
            };
        } else { // typeChart === 'bar'
            config = {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            data: data,
                            backgroundColor: '#0d9488',
                            hoverBackgroundColor: '#0f766e',
                            borderRadius: 6,
                            barPercentage: 0.55
                        }
                    ]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: '#0f172a',
                            padding: 10,
                            cornerRadius: 8
                        }
                    },
                    scales: {
                        x: {
                            grid: { display: false },
                            ticks: { color: '#94a3b8', font: { size: 11 } }
                        },
                        y: {
                            grid: { display: false },
                            ticks: { color: '#475569', font: { size: 11 } }
                        }
                    }
                }
            };
        }

        chart = new Chart(canvas, config);

        return () => {
            if (chart) chart.destroy();
        };
    });
</script>

<div class="flex flex-col gap-4">
    {#if typeChart === 'line'}
        <div class="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-100">
            <!-- Sélecteur d'onglets (Pill style) -->
            <div class="inline-flex rounded-lg bg-slate-100 p-0.5">
                <button class="rounded-md px-3 py-1 text-xs font-semibold bg-white text-cyan-950 shadow-xs hover:bg-white/90 transition-all">
                    J
                </button>
                <button class="rounded-md px-3 py-1 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors">
                    M
                </button>
                <button class="rounded-md px-3 py-1 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors">
                    A
                </button>
            </div>

            <!-- Indicateur de fuseau / période -->
            <div class="text-xs font-medium text-slate-400 bg-slate-100/60 px-2.5 py-1 rounded-md">
                Zone : <span class="font-semibold text-slate-600">2026</span>
            </div>

            <!-- Chiffre d'Affaires -->
            <div class="text-right pr-1">
                <span class="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">CA Global</span>
                <span class="text-base font-extrabold text-cyan-950">20 526 658,00 $</span>
            </div>
        </div>
    {/if}

    <!-- Canvas conteneur adaptatif -->
    <div class={`${width} relative w-full`}>
        <canvas bind:this={canvas}></canvas>
    </div>
</div>