# Deploy API - IFRO Events

## Build e Push da Imagem

```bash
cd "/home/eduardo_tartas/Documentos/Plataforma de Divulgação de Eventos/plataforma-de-divulgacao-de-eventos-api"

docker build -t eduardotartas/api-ifroevents:latest .

docker push eduardotartas/api-ifroevents:latest
```

## Deploy no Kubernetes

```bash
# MongoDB
kubectl apply -f deploy/deploy-db.yaml

# API ConfigMap
kubectl apply -f deploy/api-configmap.yaml

# API Deployment
kubectl apply -f deploy/deploy-api.yaml
```

## Remover Deploy

```bash
kubectl delete -f deploy/deploy-api.yaml

kubectl delete -f deploy/api-configmap.yaml

kubectl delete -f deploy/deploy-db.yaml
```

## Verificar Status

```bash
kubectl get pods | grep ifroevents

kubectl logs -f deployment/api-ifroevents

kubectl logs -f deployment/mongo-ifroevents
```

## URLs de Acesso

- API: https://api-ifroevents.app.fslab.dev
- Documentação: https://api-ifroevents.app.fslab.dev/docs
