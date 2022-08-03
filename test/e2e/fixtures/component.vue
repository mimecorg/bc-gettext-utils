<template>
  <div class="component">
    <p>{{ message }}</p>
    <a href="#" :title="_p( 'tooltip', 'this is a link' )">{{ _( 'click here' ) }}</a>
  </div>
</template>

<script>
import { computed } from 'vue';

export default {
  props: {
    count: Number,
  },

  setup( props ) {
    const message = computed( () => _n( 'There is one warning.', 'There are {0} warnings.', props.count, props.count ) );

    return {
      message,
    };
  },
}
</script>
