package com.urlshortener.url.config;

import com.urlshortener.url.messaging.LinkCreatedEvent;
import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.listener.ContainerProperties.AckMode;
import org.springframework.kafka.support.serializer.JsonDeserializer;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class KafkaConfig {

    @Value("${spring.kafka.bootstrap-servers:localhost:9092}")
    private String bootstrapServers;

    @Value("${app.kafka.link-created-topic:link-created-events}")
    private String linkCreatedTopic;

    @Value("${app.kafka.link-created-dlq-topic:link-created-dlq}")
    private String linkCreatedDlqTopic;

    @Bean
    public NewTopic linkCreatedTopic() {
        return TopicBuilder.name(linkCreatedTopic)
                .partitions(6)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic linkCreatedDlqTopic() {
        return TopicBuilder.name(linkCreatedDlqTopic)
                .partitions(6)
                .replicas(1)
                .build();
    }

    @Bean
    public ConsumerFactory<String, LinkCreatedEvent> linkCreatedConsumerFactory() {
        JsonDeserializer<LinkCreatedEvent> deserializer = new JsonDeserializer<>(LinkCreatedEvent.class);
        deserializer.setUseTypeHeaders(false);

        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, JsonDeserializer.class);
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, "false");
        props.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, 100);

        return new DefaultKafkaConsumerFactory<>(props,
                new StringDeserializer(), deserializer);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, LinkCreatedEvent>
            batchKafkaListenerContainerFactory(ConsumerFactory<String, LinkCreatedEvent> linkCreatedConsumerFactory) {
        ConcurrentKafkaListenerContainerFactory<String, LinkCreatedEvent> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(linkCreatedConsumerFactory);
        factory.setBatchListener(true);
        factory.setConcurrency(3);
        factory.getContainerProperties().setAckMode(AckMode.MANUAL);
        return factory;
    }
}
