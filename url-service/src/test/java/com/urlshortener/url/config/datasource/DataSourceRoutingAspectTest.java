package com.urlshortener.url.config.datasource;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.reflect.MethodSignature;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DataSourceRoutingAspectTest {

    @Mock
    private ProceedingJoinPoint joinPoint;

    @Mock
    private MethodSignature signature;

    private final DataSourceRoutingAspect aspect = new DataSourceRoutingAspect();

    private static class TestService {
        @LeaderDataSource
        public String leader() {
            return "leader-result";
        }

        @FollowerDataSource
        public String follower() {
            return "follower-result";
        }

        public String plain() {
            return "plain-result";
        }
    }

    private Method getMethod(String name) throws Exception {
        return TestService.class.getMethod(name);
    }

    @Test
    void routesToLeader() throws Throwable {
        when(signature.getMethod()).thenReturn(getMethod("leader"));
        when(signature.getDeclaringType()).thenReturn(TestService.class);
        when(signature.getName()).thenReturn("leader");
        when(joinPoint.getSignature()).thenReturn(signature);
        when(joinPoint.proceed()).thenReturn("leader-result");

        Object result = aspect.route(joinPoint);

        assertEquals("leader-result", result);
        assertNull(DataSourceContextHolder.get(), "context must be cleared after proceed");
        verify(joinPoint).proceed();
    }

    @Test
    void routesToFollower() throws Throwable {
        when(signature.getMethod()).thenReturn(getMethod("follower"));
        when(signature.getDeclaringType()).thenReturn(TestService.class);
        when(signature.getName()).thenReturn("follower");
        when(joinPoint.getSignature()).thenReturn(signature);
        when(joinPoint.proceed()).thenReturn("follower-result");

        Object result = aspect.route(joinPoint);

        assertEquals("follower-result", result);
        assertNull(DataSourceContextHolder.get());
    }

    @Test
    void clearsContextWhenProceedThrows() throws Throwable {
        when(signature.getMethod()).thenReturn(getMethod("leader"));
        when(signature.getDeclaringType()).thenReturn(TestService.class);
        when(signature.getName()).thenReturn("leader");
        when(joinPoint.getSignature()).thenReturn(signature);
        when(joinPoint.proceed()).thenThrow(new RuntimeException("boom"));

        assertThrows(RuntimeException.class, () -> aspect.route(joinPoint));
        assertNull(DataSourceContextHolder.get(), "context must be cleared on exception");
    }
}
