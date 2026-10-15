import { createApp } from 'vue';
import { provideGlobalGridOptions } from 'ag-grid-community';
import App from './App.vue';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

provideGlobalGridOptions({ theme: 'legacy' });

createApp(App).mount('#app');