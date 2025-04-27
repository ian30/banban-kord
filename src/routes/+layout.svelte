<script>
  import { onMount } from 'svelte';
  import "bootstrap/dist/css/bootstrap.min.css";
  import "bootstrap-icons/font/bootstrap-icons.css";
  import "../app.css";
  
  // Import Bootstrap JS
  onMount(() => {
    // @ts-ignore
    import('bootstrap/dist/js/bootstrap.bundle.min.js');
  });
</script>

<div class="app-container">
  <slot />
</div>

<style>
  .app-container {
    min-height: 100vh;
  }
  
  /* Column color classes */
  :global(.column-blue) { background-color: #e3f2fd; border-top: 3px solid #2196f3; }
  :global(.column-green) { background-color: #e8f5e9; border-top: 3px solid #4caf50; }
  :global(.column-red) { background-color: #ffebee; border-top: 3px solid #f44336; }
  :global(.column-purple) { background-color: #f3e5f5; border-top: 3px solid #9c27b0; }
  :global(.column-orange) { background-color: #fff3e0; border-top: 3px solid #ff9800; }
  :global(.column-teal) { background-color: #e0f2f1; border-top: 3px solid #009688; }
  
  /* Card color classes */
  :global(.card-blue) { border-left: 4px solid #2196f3; }
  :global(.card-green) { border-left: 4px solid #4caf50; }
  :global(.card-red) { border-left: 4px solid #f44336; }
  :global(.card-purple) { border-left: 4px solid #9c27b0; }
  :global(.card-orange) { border-left: 4px solid #ff9800; }
  :global(.card-teal) { border-left: 4px solid #009688; }
</style>