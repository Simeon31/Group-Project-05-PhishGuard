<template>
    <div class="bg-gray-800 border border-gray-700 rounded-lg p-6 shadow-lg">
        <h3 class="text-gray-400 text-sm font-medium uppercase tracking-wider mb-4">User Struggle by Attack Type</h3>
        <div v-if="series.length > 0" class="w-full h-80">
            <apexchart type="line" height="300" :options="chartOptions" :series="series" />
        </div>
        <div v-else class="flex flex-col items-center justify-center h-64 text-gray-500">
            <p>No enough data to display charts yet.</p>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    data: {
        type: Array,
        default: () => []
    }
});

const series = computed(() => {
    if (!props.data || props.data.length === 0) return [];

    return [
        {
            name: 'Incorrect Attempts (Frequency)',
            type: 'column',
            data: props.data.map(d => d.frequency)
        },
        {
            name: 'Cumulative %',
            type: 'line',
            data: props.data.map(d => d.cumulativePercentage)
        }
    ];
});

const chartOptions = computed(() => {
    const categories = props.data.map(d => d.type);

    return {
        chart: {
            type: 'line',
            toolbar: { show: false },
            fontFamily: 'Segoe UI, sans-serif'
        },
        stroke: {
            width: [0, 4],
            curve: 'smooth'
        },
        title: {
            text: undefined
        },
        dataLabels: {
            enabled: true,
            enabledOnSeries: [1],
            formatter: function (val) {
                return val + "%"
            }
        },
        labels: categories,
        xaxis: {
            categories: categories,
            labels: {
                style: { colors: '#94a3b8' }
            }
        },
        yaxis: [
            {
                title: {
                    text: 'Frequency (Misses)',
                    style: { color: '#00E396' }
                },
                labels: {
                    style: { colors: '#94a3b8' }
                }
            },
            {
                opposite: true,
                title: {
                    text: 'Cumulative %',
                    style: { color: '#FEB019' }
                },
                min: 0,
                max: 100,
                labels: {
                    style: { colors: '#94a3b8' }
                }
            }
        ],
        theme: {
            mode: 'dark'
        },
        tooltip: {
            theme: 'dark'
        },
        colors: ['#00E5FF', '#F59E0B'],
        grid: {
            borderColor: '#334155'
        }
    };
});
</script>
