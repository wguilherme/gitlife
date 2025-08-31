#!/bin/bash
# Deployment script for GitLife on Kubernetes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}GitLife Kubernetes Deployment${NC}"
echo "================================="

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}kubectl is not installed or not in PATH${NC}"
    exit 1
fi

# Function to check if namespace exists
check_namespace() {
    if kubectl get namespace gitlife &> /dev/null; then
        echo -e "${YELLOW}Namespace 'gitlife' already exists${NC}"
    else
        echo -e "${GREEN}Creating namespace 'gitlife'${NC}"
        kubectl apply -f namespace.yaml
    fi
}

# Function to create SSH secret
create_ssh_secret() {
    echo -e "${YELLOW}SSH Key Setup${NC}"
    echo "You need to create an SSH key for GitLife to access your vault repository."
    echo
    
    if kubectl get secret gitlife-ssh-key -n gitlife &> /dev/null; then
        echo -e "${YELLOW}SSH secret 'gitlife-ssh-key' already exists${NC}"
        read -p "Do you want to recreate it? (y/N): " recreate
        if [[ $recreate =~ ^[Yy]$ ]]; then
            kubectl delete secret gitlife-ssh-key -n gitlife
        else
            return
        fi
    fi

    echo "Options:"
    echo "1. Use existing SSH key"
    echo "2. Generate new SSH key"
    read -p "Choose option (1-2): " option

    case $option in
        1)
            read -p "Enter path to private key: " private_key
            read -p "Enter path to public key: " public_key
            
            if [[ ! -f "$private_key" ]] || [[ ! -f "$public_key" ]]; then
                echo -e "${RED}Key files not found${NC}"
                exit 1
            fi
            ;;
        2)
            echo -e "${GREEN}Generating new SSH key for GitLife...${NC}"
            key_path="/tmp/gitlife_rsa"
            ssh-keygen -t rsa -b 4096 -f "$key_path" -C "gitlife@kubernetes" -N ""
            private_key="$key_path"
            public_key="$key_path.pub"
            
            echo -e "${YELLOW}Public key (add this to your Git repository's deploy keys):${NC}"
            cat "$public_key"
            echo
            read -p "Press Enter after adding the public key to your repository..."
            ;;
        *)
            echo -e "${RED}Invalid option${NC}"
            exit 1
            ;;
    esac

    kubectl create secret generic gitlife-ssh-key \
        --from-file=id_rsa="$private_key" \
        --from-file=id_rsa.pub="$public_key" \
        --namespace=gitlife

    echo -e "${GREEN}SSH secret created successfully${NC}"

    # Cleanup temporary keys
    if [[ $option == "2" ]]; then
        rm -f "$private_key" "$public_key"
    fi
}

# Function to update ConfigMap
update_config() {
    echo -e "${YELLOW}Configuration Setup${NC}"
    
    read -p "Enter your vault repository URL (git@github.com:user/repo.git): " vault_repo
    read -p "Enter Git user name [GitLife Bot]: " git_user_name
    read -p "Enter Git user email [gitlife@example.com]: " git_user_email
    
    git_user_name=${git_user_name:-"GitLife Bot"}
    git_user_email=${git_user_email:-"gitlife@example.com"}
    
    # Update configmap.yaml with user values
    sed -i.bak "s|git@github.com:your-org/gitlife-vault.git|$vault_repo|g" configmap.yaml
    sed -i.bak "s|GitLife Bot|$git_user_name|g" configmap.yaml
    sed -i.bak "s|gitlife@example.com|$git_user_email|g" configmap.yaml
    
    rm -f configmap.yaml.bak
    echo -e "${GREEN}Configuration updated${NC}"
}

# Main deployment
main() {
    echo "Starting deployment..."
    
    check_namespace
    
    echo -e "${GREEN}Step 1: SSH Key Setup${NC}"
    create_ssh_secret
    
    echo -e "${GREEN}Step 2: Configuration${NC}"
    update_config
    
    echo -e "${GREEN}Step 3: Deploying resources${NC}"
    kubectl apply -f rbac.yaml
    kubectl apply -f configmap.yaml
    kubectl apply -f pvc.yaml
    kubectl apply -f deployment.yaml
    
    echo -e "${GREEN}Deployment completed!${NC}"
    echo
    echo "Check the deployment status with:"
    echo "  kubectl get pods -n gitlife"
    echo "  kubectl logs -f deployment/gitlife -n gitlife"
    echo
    echo "Useful commands:"
    echo "  kubectl exec -it deployment/gitlife -n gitlife -- ./gitlife vault status"
    echo "  kubectl exec -it deployment/gitlife -n gitlife -- ./gitlife reading list"
}

# Check if running in script mode or being sourced
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi