package com.urlshortener.url.config.datasource;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Slf4j
@Aspect
@Component
@Order(0)
public class DataSourceRoutingAspect {

    @Around("@annotation(com.urlshortener.url.config.datasource.LeaderDataSource) || @within(com.urlshortener.url.config.datasource.LeaderDataSource) || @annotation(com.urlshortener.url.config.datasource.FollowerDataSource) || @within(com.urlshortener.url.config.datasource.FollowerDataSource)")
    public Object route(ProceedingJoinPoint joinPoint) throws Throwable {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        boolean leader = AnnotatedElementUtils.hasAnnotation(signature.getMethod(), LeaderDataSource.class)
                || AnnotatedElementUtils.hasAnnotation(signature.getDeclaringType(), LeaderDataSource.class);

        if (leader) {
            DataSourceContextHolder.setLeader();
        } else {
            DataSourceContextHolder.setFollower();
        }

        log.debug("Datasource routed to {} for {}#{}",
                DataSourceContextHolder.get(),
                signature.getDeclaringType().getSimpleName(),
                signature.getName());

        try {
            return joinPoint.proceed();
        } finally {
            DataSourceContextHolder.clear();
        }
    }
}