<!-- src/lib/components/GoogleOneTap.svelte -->
<script lang="ts">
  import { onMount } from "svelte";
  import { authClient } from "$lib/auth-client";

  let {onSuccess = () => {}}: { onSuccess?: () => void } = $props();

  // Récupérer la session active pour ne pas afficher One Tap si l'utilisateur est déjà connecté
  const session = authClient.useSession();

  onMount(() => {
    // Si l'utilisateur n'est pas connecté, lancer One Tap
    if (!$session.data) {
      authClient.oneTap({
        // Redirection après connexion réussie
        onSuccess: () => {
          onSuccess();
        },
        // Optionnel : Annuler ou gérer les fermetures manuelles par l'utilisateur
        onDismiss: () => {
          console.log("L'utilisateur a fermé la bannière One Tap");
        },
      });
    }
  });
</script>

<!-- Google One Tap s'injecte directement dans le DOM via le SDK Google -->